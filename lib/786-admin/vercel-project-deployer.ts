import { neon } from "@neondatabase/serverless"

const DEFAULT_REPOSITORY_ID = "1250394192"
const GIT_REF_RETRY_ATTEMPTS = 5
const GIT_REF_RETRY_DELAY_MS = 2_000

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

function safeSchemaName(projectId: string): string {
  return `generated_${projectSuffix(projectId)}`
}

function scopedDatabaseUrl(baseUrl: string, schema: string): string {
  const url = new URL(baseUrl)
  url.searchParams.set("options", `-csearch_path=${schema}`)
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
  const schema = safeSchemaName(input.projectId)
  const adminSql = neon(baseUrl)
  await adminSql.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`, [])

  const runtimeUrl = scopedDatabaseUrl(baseUrl, schema)
  const runtimeSql = neon(runtimeUrl)
  const schemaSource = input.files["sql/schema.sql"] || input.files["sql/migrations/001_initial.sql"] || ""
  for (const statement of migrationStatements(schemaSource)) {
    await runtimeSql.query(statement, [])
  }

  const extraMigrations = Object.entries(input.files)
    .filter(([path]) => /^sql\/migrations\/(?!001_initial\.sql$).+\.sql$/i.test(path))
    .sort(([left], [right]) => left.localeCompare(right))
  for (const [, source] of extraMigrations) {
    for (const statement of migrationStatements(source)) {
      await runtimeSql.query(statement, [])
    }
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

async function ensureVercelProject(input: {
  projectName: string
  rootDirectory: string
  token: string
  teamId?: string
}): Promise<void> {
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
  if (response.ok || response.status === 409) return
  const payload = (await response.json().catch(() => null)) as null | { error?: { message?: unknown } }
  const detail = typeof payload?.error?.message === "string"
    ? payload.error.message
    : `Vercel project setup failed with ${response.status}`
  throw new Error(detail.slice(0, 500))
}

async function upsertRuntimeEnvironment(input: {
  projectName: string
  databaseUrl: string | null
  token: string
  teamId?: string
}): Promise<void> {
  if (!input.databaseUrl) return
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
      key: "DATABASE_URL",
      value: input.databaseUrl,
      type: "encrypted",
      target: ["preview", "production"],
      comment: "Managed by 786.Chat generated runtime",
    }),
    cache: "no-store",
  })
  if (response.ok) return
  const payload = (await response.json().catch(() => null)) as null | { error?: { message?: unknown } }
  const detail = typeof payload?.error?.message === "string"
    ? payload.error.message
    : `Vercel runtime environment update failed with ${response.status}`
  throw new Error(detail.slice(0, 500))
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
  const deadline = Date.now() + 75_000
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
  throw new Error("Vercel deployment did not become ready within 75 seconds")
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

  await ensureVercelProject({ projectName, rootDirectory, token, teamId })
  await upsertRuntimeEnvironment({ projectName, databaseUrl, token, teamId })

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
