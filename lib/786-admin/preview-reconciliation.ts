const DEFAULT_PROJECT_PREFIX = "786-generated-"
const IMPORTED_RUNTIME_HEALTH_PATH = "/__786-runtime-health"

export type GeneratedPreviewState = {
  id: string
  url: string | null
  state: string
}

type VercelDeploymentListPayload = {
  deployments?: Array<{
    uid?: unknown
    id?: unknown
    url?: unknown
    state?: unknown
    readyState?: unknown
  }>
}

function projectSuffix(projectId: string): string {
  return projectId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "project"
}

function generatedProjectName(projectId: string): string {
  return `${DEFAULT_PROJECT_PREFIX}${projectSuffix(projectId)}`
}

async function probeUrl(url: string, controller: AbortController): Promise<Response> {
  return fetch(url, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    signal: controller.signal,
    headers: { Accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
  })
}

async function readyRuntimeState(url: string): Promise<"healthy" | "failed" | "unknown"> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const base = url.endsWith("/") ? url.slice(0, -1) : url
    const runtimeResponse = await probeUrl(`${base}${IMPORTED_RUNTIME_HEALTH_PATH}`, controller)

    // Imported Express/Vite bridges expose a dedicated 204 probe that forces the
    // backend cold start. A 5xx here must never be published as Live Preview READY.
    if (runtimeResponse.status === 204) return "healthy"
    if (runtimeResponse.status >= 500) return "failed"

    // Normal generated Next.js projects do not expose the imported-runtime probe.
    // Fall back to the root page for those projects.
    const response = await probeUrl(url, controller)
    return response.status >= 500 ? "failed" : "healthy"
  } catch {
    // Network/transient probe failures should be retried by normal builder polling,
    // rather than incorrectly marking the build passed or permanently failed.
    return "unknown"
  } finally {
    clearTimeout(timeout)
  }
}

export async function findGeneratedPreviewState(input: {
  projectId: string
  commitSha: string
}): Promise<GeneratedPreviewState | null> {
  const token = process.env.VERCEL_TOKEN?.trim()
  if (!token) return null
  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  const endpoint = new URL("https://api.vercel.com/v7/deployments")
  endpoint.searchParams.set("sha", input.commitSha)
  endpoint.searchParams.set("app", generatedProjectName(input.projectId))
  endpoint.searchParams.set("limit", "20")
  if (teamId) endpoint.searchParams.set("teamId", teamId)

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!response.ok) return null
  const payload = (await response.json().catch(() => null)) as VercelDeploymentListPayload | null
  const candidate = payload?.deployments?.find((item) => {
    const id = typeof item.uid === "string"
      ? item.uid
      : typeof item.id === "string"
        ? item.id
        : ""
    const state = String(item.readyState || item.state || "").toUpperCase()
    return Boolean(id && state)
  })
  if (!candidate) return null

  const id = typeof candidate.uid === "string"
    ? candidate.uid
    : typeof candidate.id === "string"
      ? candidate.id
      : ""
  let state = String(candidate.readyState || candidate.state || "").toUpperCase()
  if (!id || !state) return null

  let url: string | null = null
  if (typeof candidate.url === "string") {
    const normalized = candidate.url.startsWith("https://") ? candidate.url : `https://${candidate.url}`
    if (normalized.endsWith(".vercel.app")) url = normalized
  }

  if (state === "READY" && url) {
    const runtime = await readyRuntimeState(url)
    if (runtime === "failed") state = "ERROR"
    else if (runtime === "unknown") state = "BUILDING"
  }

  return { id, url, state }
}

export async function findReadyGeneratedPreview(input: {
  projectId: string
  commitSha: string
}): Promise<{ id: string; url: string } | null> {
  const preview = await findGeneratedPreviewState(input)
  if (!preview || preview.state !== "READY" || !preview.url) return null
  return { id: preview.id, url: preview.url }
}
