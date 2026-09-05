import { createHash } from "crypto"
import { neon } from "@neondatabase/serverless"
import { sql } from "./db"

const DEFAULT_REPOSITORY_ID = "1250394192"
const GIT_REF_RETRY_ATTEMPTS = 5
const GIT_REF_RETRY_DELAY_MS = 2_000
const VERCEL_READY_TIMEOUT_MS = 240_000

export type GeneratedProjectDeployment = {
  id: string
  url: string
  readyState: string
}

type VercelDeploymentPayload = {
  id?: unknown
  url?: unknown
  readyState?: unknown
  error?: { message?: unknown }
}

type VercelDeploymentListPayload = {
  deployments?: Array<{
    uid?: unknown
    id?: unknown
    url?: unknown
    state?: unknown
    readyState?: unknown
  }>
  error?: { message?: unknown }
}

type VercelProjectPayload = {
  id?: unknown
  error?: { message?: unknown }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function generatedDatabaseBaseUrl(): string {
  const value =
    process.env.GENERATED_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()
  if (!value) throw new Error("Generated project database runtime is not configured")
  return value
}

function projectSuffix(projectId: string): string {
  return projectId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "project"
}

function safeProjectName(projectId: string): string {
  return `786-generated-${projectSuffix(projectId)}`
}

function safeDatabaseName(projectId: string): string {
  return `generated_${projectSuffix(projectId)}`
}

function isExactGeneratedDatabase(database: string, projectId: string): boolean {
  return /^generated_[a-z0-9]{1,12}$/.test(database) && database === safeDatabaseName(projectId)
}

function generatedAuthSecret(projectId: string, databaseUrl: string): string {
  return createHash("sha256")
    .update(`786.chat-auth-v1:${projectId}:${databaseUrl}`)
    .digest("hex")
}

function generatedUsesEmail(files: Record<string, string>): boolean {
  const manifest = files["backend/manifest.json"] || ""
  const email = files["lib/server/email.ts"] || ""
  return /RESEND_API_KEY|["']email["']\s*:/i.test(manifest) || /\bResend\b|RESEND_API_KEY/.test(email)
}

function generatedUsesBlob(files: Record<string, string>): boolean {
  return Object.values(files).some((source) =>
    /@vercel\/blob|BLOB_READ_WRITE_TOKEN|\bgetDownloadUrl\s*\(|\bput\s*\([^)]*access\s*:\s*["']private["']/i.test(source),
  )
}

function generatedEmailFrom(): string {
  const configured =
    process.env.GENERATED_EMAIL_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    process.env.AUTH_EMAIL_FROM?.trim() ||
    "onboarding@resend.dev"
  const bracketed = configured.match(/<\s*([^<>\s]+@[^<>\s]+)\s*>/)
  return (bracketed?.[1] || configured).trim()
}

async function hasSuccessfulDeployment(projectId: string): Promise<boolean> {
  const rows = (await sql`
    SELECT EXISTS (
      SELECT 1
      FROM admin_project_builds
      WHERE project_id = ${projectId}
        AND status = 'passed'
        AND deployment_url IS NOT NULL
        AND deployment_url <> ''
    ) AS deployed
  `) as unknown as Array<{ deployed: boolean }>
  return rows[0]?.deployed === true
}

function isRecoverablePartialDatabaseError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "")
  return /(?:column|relation|constraint|index|type).*(?:does not exist|already exists)|duplicate (?:column|table|object|type)|undefined (?:column|table|type)/i.test(message)
}

function isAlreadyAppliedMigrationError(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code || "")
      : ""
  if (["42710", "42P07", "42701"].includes(code)) return true

  const message = error instanceof Error ? error.message : String(error || "")
  return /(?:type|relation|table|column|constraint|index).*(?:already exists)|duplicate (?:object|table|column|type|constraint|index)/i.test(message)
}

function scopedDatabaseUrl(baseUrl: string, database: string): string {
  const url = new URL(baseUrl)
  url.pathname = `/${database}`
  // Legacy generated runtimes used a connection-string search_path option. Neon HTTP
  // queries do not preserve session settings reliably, so use a real per-project
  // database instead and remove the old option completely.
  url.searchParams.delete("options")
  return url.toString()
}

function migrationStatements(source: string): string[] {
  return source
    .replace(/^\s*--.*$/gm, "")
    .split(/;\s*(?:\r?\n|$)/)
    .map((value) => value.trim())
    .filter(Boolean)
}

async function prepareGeneratedRuntimeDatabase(input: {
  projectId: string
  files: Record<string, string>
}): Promise<string | null> {
  const hasDatabaseRuntime = Boolean(
    input.files["lib/server/db.ts"]?.trim() &&
    (input.files["sql/schema.sql"]?.trim() || input.files["sql/migrations/001_initial.sql"]?.trim()),
  )
  if (!hasDatabaseRuntime) return null

  const baseUrl = generatedDatabaseBaseUrl()
  const database = safeDatabaseName(input.projectId)
  const adminSql = neon(baseUrl)
  const existing = (await adminSql.query(
    "SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1",
    [database],
  )) as unknown as Array<Record<string, unknown>>
  if (!existing.length) {
    await adminSql.query(`CREATE DATABASE "${database}"`, [])
  }

  const runtimeUrl = scopedDatabaseUrl(baseUrl, database)
  let runtimeSql = neon(runtimeUrl)

  const runMigrationStatements = async (source: string) => {
    for (const statement of migrationStatements(source)) {
      try {
        await runtimeSql.query(statement, [])
      } catch (error) {
        // Generated previews can retry the same schema after a slow/failed publish.
        // PostgreSQL reports already-created enums, tables, indexes and columns as
        // duplicate-object errors. Those statements are safe to skip; unexpected
        // migration errors still fail the build.
        if (isAlreadyAppliedMigrationError(error)) continue
        throw error
      }
    }
  }

  const applyMigrations = async () => {
    const schemaSource = input.files["sql/schema.sql"] || input.files["sql/migrations/001_initial.sql"] || ""
    await runMigrationStatements(schemaSource)

    const extraMigrations = Object.entries(input.files)
      .filter(([path]) => /^sql\/migrations\/(?!001_initial\.sql$).+\.sql$/i.test(path))
      .sort(([left], [right]) => left.localeCompare(right))
    for (const [, source] of extraMigrations) {
      await runMigrationStatements(source)
    }
  }

  try {
    await applyMigrations()
  } catch (error) {
    const deployed = await hasSuccessfulDeployment(input.projectId)
    const mayRecover =
      !deployed &&
      isExactGeneratedDatabase(database, input.projectId) &&
      isRecoverablePartialDatabaseError(error)

    if (!mayRecover) throw error

    // A failed first publish can leave a partial generated-only database. Reset only
    // this exact project database once, then rerun the idempotent migrations. Existing
    // deployed apps are never reset by this path.
    await adminSql.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`, [])
    await adminSql.query(`CREATE DATABASE "${database}"`, [])
    runtimeSql = neon(runtimeUrl)
    await applyMigrations()
  }

  return runtimeUrl
}

function isTransientGitRefError(message: string): boolean {
  return (
    /\bref\b.+\bdoes not exist\b/i.test(message) ||
    /\bgit (?:reference|ref)\b.+\bnot found\b/i.test(message) ||
    /\bcommit\b.+\bnot found\b/i.test(message)
  )
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function getVercelProjectId(input: {
  projectName: string
  token: string
  teamId?: string
}): Promise<string> {
  const endpoint = new URL(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(input.projectName)}`,
  )
  if (input.teamId) endpoint.searchParams.set("teamId", input.teamId)
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${input.token}` },
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => null)) as VercelProjectPayload | null
  if (response.ok && typeof payload?.id === "string" && payload.id) return payload.id
  const detail = typeof payload?.error?.message === "string"
    ? payload.error.message
    : `Vercel project lookup failed with ${response.status}`
  throw new Error(detail.slice(0, 500))
}

async function ensureVercelProject(input: {
  projectName: string
  rootDirectory: string
  token: string
  teamId?: string
}): Promise<string> {
  const endpoint = new URL("https://api.vercel.com/v11/projects")
  if (input.teamId) endpoint.searchParams.set("teamId", input.teamId)
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.projectName,
      framework: "nextjs",
      rootDirectory: input.rootDirectory,
    }),
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => null)) as VercelProjectPayload | null
  if (response.ok) {
    if (typeof payload?.id === "string" && payload.id) return payload.id
    return getVercelProjectId(input)
  }
  if (response.status === 409) return getVercelProjectId(input)
  const detail = typeof payload?.error?.message === "string"
    ? payload.error.message
    : `Vercel project setup failed with ${response.status}`
  throw new Error(detail.slice(0, 500))
}

async function ensureGeneratedBlobStore(input: {
  projectId: string
  vercelProjectId: string
  token: string
  teamId?: string
}): Promise<void> {
  const endpoint = new URL("https://api.vercel.com/storage/stores/blob")
  if (input.teamId) endpoint.searchParams.set("teamId", input.teamId)
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `786-${projectSuffix(input.projectId)}-uploads`,
      access: "private",
      projectId: input.vercelProjectId,
    }),
    cache: "no-store",
  })
  if (response.ok || response.status === 409) return
  const payload = (await response.json().catch(() => null)) as null | { error?: { message?: unknown } }
  const detail = typeof payload?.error?.message === "string"
    ? payload.error.message
    : `Vercel Blob store setup failed with ${response.status}`
  throw new Error(detail.slice(0, 500))
}

async function upsertRuntimeEnvironment(input: {
  projectId: string
  projectName: string
  databaseUrl: string | null
  files: Record<string, string>
  token: string
  teamId?: string
}): Promise<void> {
  const values: Array<{ key: string; value: string }> = []

  if (input.databaseUrl) {
    values.push(
      { key: "DATABASE_URL", value: input.databaseUrl },
      { key: "AUTH_SECRET", value: generatedAuthSecret(input.projectId, input.databaseUrl) },
    )
  }

  if (generatedUsesEmail(input.files)) {
    const resendApiKey = process.env.RESEND_API_KEY?.trim()
    if (!resendApiKey) {
      throw new Error("Generated email runtime requires RESEND_API_KEY on 786.Chat")
    }
    values.push(
      { key: "RESEND_API_KEY", value: resendApiKey },
      { key: "EMAIL_FROM", value: generatedEmailFrom() },
    )
  }

  if (!values.length) return

  for (const entry of values) {
    const endpoint = new URL(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(input.projectName)}/env`,
    )
    endpoint.searchParams.set("upsert", "true")
    if (input.teamId) endpoint.searchParams.set("teamId", input.teamId)
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: entry.key,
        value: entry.value,
        type: "encrypted",
        target: ["preview", "production"],
        comment: "Managed by 786.Chat generated runtime",
      }),
      cache: "no-store",
    })
    if (response.ok) continue
    const payload = (await response.json().catch(() => null)) as null | { error?: { message?: unknown } }
    const detail = typeof payload?.error?.message === "string"
      ? payload.error.message
      : `Vercel runtime environment update failed with ${response.status}`
    throw new Error(detail.slice(0, 500))
  }
}

async function deploymentState(
  endpoint: URL,
  token: string,
): Promise<{ readyState?: unknown; error?: { message?: unknown } }> {
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => null)) as null | {
    readyState?: unknown
    error?: { message?: unknown }
  }
  if (!response.ok || !payload) {
    const detail = typeof payload?.error?.message === "string"
      ? payload.error.message
      : `Vercel deployment status failed with ${response.status}`
    throw new Error(detail.slice(0, 500))
  }
  return payload
}

async function readyDeploymentForCommit(input: {
  commitSha: string
  projectName: string
  token: string
  teamId?: string
}): Promise<GeneratedProjectDeployment | null> {
  const endpoint = new URL("https://api.vercel.com/v7/deployments")
  endpoint.searchParams.set("sha", input.commitSha)
  endpoint.searchParams.set("app", input.projectName)
  endpoint.searchParams.set("limit", "20")
  if (input.teamId) endpoint.searchParams.set("teamId", input.teamId)
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${input.token}` },
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => null)) as VercelDeploymentListPayload | null
  if (!response.ok || !payload) return null
  const deployment = payload.deployments?.find((candidate) =>
    String(candidate.readyState || candidate.state || "").toUpperCase() === "READY" &&
    typeof candidate.url === "string"
  )
  if (!deployment || typeof deployment.url !== "string") return null
  const id = typeof deployment.uid === "string"
    ? deployment.uid
    : typeof deployment.id === "string"
      ? deployment.id
      : ""
  if (!id) return null
  const url = deployment.url.startsWith("https://")
    ? deployment.url
    : `https://${deployment.url}`
  return { id, url, readyState: "READY" }
}

async function waitForReadyDeployment(input: {
  id: string
  url: string
  commitSha: string
  projectName: string
  token: string
  teamId?: string
}): Promise<GeneratedProjectDeployment> {
  const deadline = Date.now() + VERCEL_READY_TIMEOUT_MS
  const endpoint = new URL(`https://api.vercel.com/v13/deployments/${input.id}`)
  if (input.teamId) endpoint.searchParams.set("teamId", input.teamId)
  let terminalState: string | null = null

  while (Date.now() < deadline) {
    const payload = await deploymentState(endpoint, input.token)
    const state = typeof payload.readyState === "string"
      ? payload.readyState.toUpperCase()
      : "UNKNOWN"
    if (state === "READY") {
      return { id: input.id, url: input.url, readyState: state }
    }
    if (["ERROR", "CANCELED"].includes(state)) {
      terminalState = state
    }
    const branchDeployment = await readyDeploymentForCommit(input)
    if (branchDeployment) return branchDeployment
    if (terminalState) {
      throw new Error(`Vercel deployment finished with state ${terminalState}`)
    }
    await wait(2_500)
  }
  if (terminalState) {
    throw new Error(`Vercel deployment finished with state ${terminalState}`)
  }
  throw new Error(`Vercel deployment did not become ready within ${Math.round(VERCEL_READY_TIMEOUT_MS / 1000)} seconds`)
}

async function allowEmbeddedRuntimePreview(input: {
  projectName: string
  token: string
  teamId?: string
}): Promise<void> {
  const endpoint = new URL(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(input.projectName)}`,
  )
  if (input.teamId) endpoint.searchParams.set("teamId", input.teamId)
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ssoProtection: null }),
    cache: "no-store",
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as null | {
      error?: { message?: unknown }
    }
    const detail = typeof payload?.error?.message === "string"
      ? payload.error.message
      : `Vercel preview access update failed with ${response.status}`
    throw new Error(detail.slice(0, 500))
  }
}

export async function deployGeneratedProjectToVercel(input: {
  projectId: string
  branch: string
  commitSha: string
  files: Record<string, string>
}): Promise<GeneratedProjectDeployment> {
  const token = requiredEnv("VERCEL_TOKEN")
  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  const repositoryId = process.env.VERCEL_GITHUB_REPOSITORY_ID?.trim() || DEFAULT_REPOSITORY_ID
  const rootDirectory = `generated-projects/${input.projectId}`
  const projectName = safeProjectName(input.projectId)
  const databaseUrl = await prepareGeneratedRuntimeDatabase({
    projectId: input.projectId,
    files: input.files,
  })

  const vercelProjectId = await ensureVercelProject({ projectName, rootDirectory, token, teamId })
  if (generatedUsesBlob(input.files)) {
    await ensureGeneratedBlobStore({
      projectId: input.projectId,
      vercelProjectId,
      token,
      teamId,
    })
  }
  await upsertRuntimeEnvironment({
    projectId: input.projectId,
    projectName,
    databaseUrl,
    files: input.files,
    token,
    teamId,
  })

  const endpoint = new URL("https://api.vercel.com/v13/deployments")
  if (teamId) endpoint.searchParams.set("teamId", teamId)

  let payload: VercelDeploymentPayload | null = null

  for (let attempt = 1; attempt <= GIT_REF_RETRY_ATTEMPTS; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        target: "staging",
        gitSource: {
          type: "github",
          repoId: repositoryId,
          ref: input.branch,
          sha: input.commitSha,
        },
        projectSettings: {
          framework: "nextjs",
          rootDirectory,
        },
      }),
      cache: "no-store",
    })

    payload = (await response.json().catch(() => null)) as VercelDeploymentPayload | null
    if (
      response.ok &&
      payload &&
      typeof payload.id === "string" &&
      typeof payload.url === "string"
    ) {
      break
    }

    const detail =
      payload?.error && typeof payload.error.message === "string"
        ? payload.error.message
        : `Vercel deployment request failed with status ${response.status}`
    if (attempt === GIT_REF_RETRY_ATTEMPTS || !isTransientGitRefError(detail)) {
      throw new Error(detail.slice(0, 500))
    }
    await wait(GIT_REF_RETRY_DELAY_MS)
  }

  if (!payload || typeof payload.id !== "string" || typeof payload.url !== "string") {
    throw new Error("Vercel deployment request did not return a deployment")
  }

  const url = payload.url.startsWith("https://") ? payload.url : `https://${payload.url}`
  if (!url.endsWith(".vercel.app")) {
    throw new Error("Vercel returned an untrusted deployment URL")
  }

  await allowEmbeddedRuntimePreview({ projectName, token, teamId })
  return waitForReadyDeployment({
    id: payload.id,
    url,
    commitSha: input.commitSha,
    projectName,
    token,
    teamId,
  })
}