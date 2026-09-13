import { sql } from "@/lib/786-admin/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ projectId: string; path?: string[] }> }
type StreamingRequestInit = RequestInit & { duplex?: "half" }

type PreviewBuild = {
  id: string
  project_id: string
  deployment_url: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function unavailable(status = 404) {
  return new Response(
    "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Preview unavailable</title></head><body style=\"margin:0;display:grid;min-height:100vh;place-items:center;background:#070b12;color:#e2e8f0;font-family:system-ui\"><main style=\"text-align:center;padding:24px\"><h1>Preview unavailable</h1><p>The generated application is not ready yet.</p></main></body></html>",
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  )
}

function protectionBypassSecret(): string {
  const explicit = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim()
  if (explicit) return explicit

  // 786.Chat already uses the second half of BUILD_RUNNER_SECRET as the
  // Vercel protection-bypass value in generated-project-build.yml. Reuse it
  // only on the server so the browser never receives the credential.
  const runnerSecret = process.env.BUILD_RUNNER_SECRET?.trim() || ""
  return runnerSecret.length >= 64 ? runnerSecret.slice(32, 64) : ""
}

async function latestPreviewBuild(projectId: string): Promise<PreviewBuild | null> {
  const rows = (await sql`
    SELECT b.id, b.project_id, b.deployment_url
    FROM admin_project_builds b
    INNER JOIN admin_projects p ON p.id = b.project_id
    WHERE b.project_id = ${projectId}
      AND b.status = 'passed'
      AND b.deployment_url IS NOT NULL
      AND b.deployment_url <> ''
    ORDER BY b.completed_at DESC NULLS LAST, b.created_at DESC
    LIMIT 1
  `) as unknown as PreviewBuild[]

  return rows[0] ?? null
}

function runtimeTarget(runtimeUrl: string, path: string[], requestUrl: string) {
  const target = new URL(runtimeUrl)
  const incoming = new URL(requestUrl)
  const basePath = target.pathname === "/" ? "" : target.pathname.replace(/\/+$/, "")
  target.pathname = `${basePath}/${path.join("/")}` || "/"
  target.search = incoming.search
  return target
}

function upstreamHeaders(request: Request) {
  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("content-length")
  headers.delete("connection")
  headers.delete("cookie")
  headers.set("accept-encoding", "identity")

  const bypass = protectionBypassSecret()
  if (bypass) headers.set("x-vercel-protection-bypass", bypass)

  return headers
}

function downstreamHeaders(upstream: Response, runtimeUrl: URL, request: Request) {
  const headers = new Headers(upstream.headers)
  headers.delete("content-length")
  headers.delete("content-encoding")
  headers.delete("transfer-encoding")
  headers.delete("connection")
  headers.delete("x-frame-options")
  headers.set("Cache-Control", "no-store")
  headers.set("X-Robots-Tag", "noindex")
  headers.set("X-786-Generated-Preview", "active")

  const location = upstream.headers.get("location")
  if (location) {
    const resolved = new URL(location, runtimeUrl)
    if (resolved.origin === runtimeUrl.origin) {
      const preview = new URL(request.url)
      preview.pathname = resolved.pathname
      preview.search = resolved.search
      preview.hash = resolved.hash
      headers.set("location", preview.toString())
    }
  }

  return headers
}

async function handle(request: Request, { params }: Ctx) {
  const { projectId, path = [] } = await params
  if (!UUID_PATTERN.test(projectId)) return unavailable()

  const build = await latestPreviewBuild(projectId)
  if (!build) return unavailable()

  const target = runtimeTarget(build.deployment_url, path, request.url)
  const init: StreamingRequestInit = {
    method: request.method,
    headers: upstreamHeaders(request),
    redirect: "manual",
    cache: "no-store",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body
    init.duplex = "half"
  }

  const upstream = await fetch(target, init)
  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: downstreamHeaders(upstream, target, request),
  })
}

export const GET = handle
export const HEAD = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle
