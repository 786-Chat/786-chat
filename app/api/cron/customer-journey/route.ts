import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { issueAuthToken } from "@/lib/account-security"
import { isAdminUser } from "@/lib/admin-config"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/786-admin/db"
import { recordOperationalEvent, safeMonitoringError } from "@/lib/786-chat/monitoring"

export const runtime = "nodejs"
export const maxDuration = 300

type JourneyStage = {
  name: string
  status: "passed" | "failed"
  durationMs: number
  detail?: string
}

class JourneyError extends Error {
  constructor(public stage: string, message: string) {
    super(message)
  }
}

async function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) return true
  const session = await getSession()
  return isAdminUser(session?.email)
}

function syntheticEmail(runId: string) {
  const configured = process.env.SYNTHETIC_MONITOR_EMAIL?.trim().toLowerCase() || ""
  const match = /^([^+@]+)(?:\+[^@]*)?@([^@]+)$/.exec(configured)
  if (!match) throw new JourneyError("configuration", "SYNTHETIC_MONITOR_EMAIL is not configured correctly.")
  return `${match[1]}+786journey-${runId.slice(0, 12)}@${match[2]}`
}

function applicationOrigin(request: Request) {
  const configured = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()
  const origin = configured || new URL(request.url).origin
  if (!/^https:\/\/(?:786\.chat|[a-z0-9-]+\.vercel\.app)$/i.test(origin.replace(/\/$/, ""))) {
    throw new JourneyError("configuration", "Synthetic journey origin is not trusted.")
  }
  return origin.replace(/\/$/, "")
}

async function jsonRequest(input: {
  origin: string
  path: string
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: Record<string, unknown>
  cookie?: string
  timeoutMs?: number
}) {
  const response = await fetch(`${input.origin}${input.path}`, {
    method: input.method || "GET",
    headers: {
      ...(input.body ? { "Content-Type": "application/json" } : {}),
      ...(input.cookie ? { Cookie: input.cookie } : {}),
      "x-786-synthetic-monitor": "customer-journey-v1",
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(input.timeoutMs || 60_000),
  })
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(`${input.path} returned ${response.status}: ${String(payload.error || "Request failed")}`)
  }
  return { response, payload }
}

async function stage<T>(stages: JourneyStage[], name: string, work: () => Promise<T>) {
  const started = Date.now()
  try {
    const value = await work()
    stages.push({ name, status: "passed", durationMs: Date.now() - started })
    return value
  } catch (error) {
    stages.push({ name, status: "failed", durationMs: Date.now() - started, detail: safeMonitoringError(error) })
    throw new JourneyError(name, safeMonitoringError(error))
  }
}

async function waitForBuild(origin: string, projectId: string, cookie: string) {
  const deadline = Date.now() + 210_000
  while (Date.now() < deadline) {
    const { payload } = await jsonRequest({
      origin,
      path: `/api/786-chat/projects/${projectId}/build`,
      cookie,
      timeoutMs: 20_000,
    })
    const build = payload.build && typeof payload.build === "object"
      ? payload.build as Record<string, unknown>
      : null
    const status = String(build?.status || "")
    if (status === "passed") return build!
    if (status === "failed" || status === "cancelled") {
      throw new Error(`Generated build ${status}: ${String(build?.error_message || "No runner detail")}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000))
  }
  throw new Error("Generated build did not finish within 210 seconds.")
}

function cookieFrom(response: Response) {
  const setCookie = response.headers.get("set-cookie") || ""
  const token = /(?:^|,\s*)auth_token=([^;]+)/.exec(setCookie)?.[1]
  if (!token) throw new Error("Login did not return the secure session cookie.")
  return `auth_token=${token}`
}

async function cleanupExternalProject(projectId: string, githubBranch: string | null) {
  const vercelToken = process.env.VERCEL_TOKEN?.trim()
  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  if (vercelToken) {
    const projectName = `786-generated-${projectId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)}`
    const url = new URL(`https://api.vercel.com/v9/projects/${projectName}`)
    if (teamId) url.searchParams.set("teamId", teamId)
    await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${vercelToken}` },
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null)
  }

  const githubToken = process.env.GITHUB_BUILD_TOKEN?.trim()
  const repository = process.env.GITHUB_BUILD_REPOSITORY?.trim() || "786-Chat/786-chat"
  if (githubToken && githubBranch?.startsWith("generated/")) {
    await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${githubBranch}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null)
  }
}

export async function GET(request: Request) {
  if (!(await authorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const active = (await sql`
    SELECT id FROM builder_journey_runs
    WHERE status = 'running' AND started_at > NOW() - INTERVAL '15 minutes'
    LIMIT 1
  `) as unknown as Array<{ id: string }>
  if (active[0]) return NextResponse.json({ running: true, runId: active[0].id }, { status: 202 })

  const runId = randomUUID()
  const stages: JourneyStage[] = []
  let email: string | null = null
  let userId: string | null = null
  let projectId: string | null = null
  let githubBranch: string | null = null
  const started = Date.now()

  await sql`
    INSERT INTO builder_journey_runs (id, status, current_stage)
    VALUES (${runId}, 'running', 'configuration')
  `
  await recordOperationalEvent({ category: "journey", eventName: "customer_journey_started", status: "started", runId })

  try {
    const origin = applicationOrigin(request)
    const password = process.env.SYNTHETIC_MONITOR_PASSWORD?.trim() || ""
    if (password.length < 16 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw new JourneyError("configuration", "SYNTHETIC_MONITOR_PASSWORD must contain at least 16 characters, a letter and a number.")
    }
    email = syntheticEmail(runId)

    await stage(stages, "register", async () => {
      const { payload } = await jsonRequest({
        origin,
        path: "/api/auth/register",
        method: "POST",
        body: { name: "786 Journey Monitor", email, password },
      })
      if (payload.verificationRequired !== true) throw new Error("Registration did not require verification.")
      const users = (await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`) as unknown as Array<{ id: string }>
      if (!users[0]) throw new Error("Registered account was not persisted.")
      userId = users[0].id
    })

    await stage(stages, "verify-email", async () => {
      const token = await issueAuthToken(userId!, "email_verification", 10)
      await jsonRequest({ origin, path: "/api/auth/verify-email", method: "POST", body: { token } })
      await sql`UPDATE users SET plan = 'business' WHERE id = ${userId!}::uuid AND email = ${email}`
      await sql`UPDATE subscriptions SET plan = 'business', tokens_limit = GREATEST(tokens_limit, 1000000) WHERE user_id = ${userId!}::uuid`
    })

    const cookie = await stage(stages, "login", async () => {
      const { response } = await jsonRequest({
        origin,
        path: "/api/auth/login",
        method: "POST",
        body: { email, password },
      })
      return cookieFrom(response)
    })

    const generated = await stage(stages, "create-project", async () => {
      const generation = await jsonRequest({
        origin,
        path: "/api/786-chat/generate",
        method: "POST",
        cookie,
        timeoutMs: 150_000,
        body: { message: "Create a polished one-page website for 786 Journey Coffee with a header, hero, services and contact form." },
      })
      const generatedProject = generation.payload.project && typeof generation.payload.project === "object"
        ? generation.payload.project as Record<string, unknown>
        : null
      const files = generatedProject?.files && typeof generatedProject.files === "object"
        ? generatedProject.files as Record<string, string>
        : {}
      if (!generatedProject || Object.keys(files).length < 3) throw new Error("Generation did not return a complete project.")
      const saved = await jsonRequest({
        origin,
        path: "/api/786-chat/projects",
        method: "POST",
        cookie,
        body: {
          title: String(generatedProject.title || "786 Journey Coffee"),
          description: String(generatedProject.description || "Synthetic customer journey"),
          prompt: "Synthetic customer journey",
          files,
          metadata: {
            specification: generation.payload.specification,
            plan: generation.payload.plan,
            validation: generation.payload.validation,
            model: generation.payload.model,
            syntheticJourneyRunId: runId,
          },
        },
      })
      const project = saved.payload.project as Record<string, unknown> | undefined
      projectId = String(project?.id || "")
      if (!projectId) throw new Error("Project persistence did not return an ID.")
      return { files, metadata: (project?.metadata || {}) as Record<string, unknown> }
    })

    const editedFiles = await stage(stages, "edit-project", async () => {
      const files = { ...generated.files }
      const path = files["app/page.tsx"] ? "app/page.tsx" : Object.keys(files).find((item) => /page\.tsx$/.test(item))
      if (!path) throw new Error("Generated project has no editable page.")
      files[path] = `// synthetic-journey-edit:${runId}\n${files[path]}`
      await jsonRequest({
        origin,
        path: `/api/786-chat/projects/${projectId}`,
        method: "PATCH",
        cookie,
        body: {
          files,
          metadata: generated.metadata,
          revision_label: "Synthetic journey edit",
          revision_source: "synthetic-monitor",
          record_generation_job: false,
        },
      })
      return files
    })
    if (!editedFiles) throw new JourneyError("edit-project", "Edited files were not preserved.")

    await stage(stages, "rebuild", async () => {
      await jsonRequest({
        origin,
        path: `/api/786-chat/projects/${projectId}/build`,
        method: "POST",
        cookie,
        body: { confirm: true },
      })
      const build = await waitForBuild(origin, projectId!, cookie)
      githubBranch = typeof build.github_branch === "string" ? build.github_branch : null
      if (!/^https:\/\//.test(String(build.deployment_url || ""))) throw new Error("Build passed without a preview deployment URL.")
    })

    await stage(stages, "deploy", async () => {
      const deployment = await jsonRequest({
        origin,
        path: `/api/786-chat/projects/${projectId}/deploy`,
        method: "POST",
        cookie,
        body: { action: "deploy", addressType: "path" },
      })
      const deployedUrl = String(deployment.payload.url || "")
      const verifiedUrl = deployedUrl.startsWith("http") ? deployedUrl : `${origin}${deployedUrl}`
      const preview = await fetch(verifiedUrl, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(20_000) })
      if (!preview.ok || !/text\/html/i.test(preview.headers.get("content-type") || "")) {
        throw new Error(`Production path verification returned HTTP ${preview.status}.`)
      }
    })

    await sql`
      UPDATE builder_journey_runs
      SET status = 'passed', current_stage = 'complete', project_id = ${projectId}::uuid,
          synthetic_email = ${email}, stages = ${JSON.stringify(stages)}::jsonb,
          completed_at = NOW(), updated_at = NOW()
      WHERE id = ${runId}
    `
    await recordOperationalEvent({
      category: "journey",
      eventName: "customer_journey_passed",
      status: "succeeded",
      runId,
      projectId,
      durationMs: Date.now() - started,
      metadata: { stages: stages.map((item) => item.name) },
    })

    await cleanupExternalProject(projectId!, githubBranch)
    await sql`DELETE FROM admin_projects WHERE id = ${projectId!}::uuid AND owner_email = ${email}`
    await sql`DELETE FROM users WHERE id = ${userId!}::uuid AND email = ${email}`

    return NextResponse.json({ passed: true, runId, stages, durationMs: Date.now() - started })
  } catch (error) {
    const failure = error instanceof JourneyError ? error : new JourneyError("unknown", safeMonitoringError(error))
    await sql`
      UPDATE builder_journey_runs
      SET status = 'failed', current_stage = ${failure.stage},
          project_id = ${projectId || null}, synthetic_email = ${email},
          stages = ${JSON.stringify(stages)}::jsonb, error_message = ${failure.message},
          completed_at = NOW(), updated_at = NOW()
      WHERE id = ${runId}
    `
    await recordOperationalEvent({
      category: "journey",
      eventName: "customer_journey_failed",
      status: "failed",
      severity: "critical",
      runId,
      projectId,
      errorCode: `JOURNEY_${failure.stage.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_FAILED`,
      error: failure.message,
      durationMs: Date.now() - started,
      metadata: { failedStage: failure.stage },
    })
    return NextResponse.json({ passed: false, runId, stage: failure.stage, error: failure.message, stages }, { status: 500 })
  }
}
