const DEFAULT_PROJECT_PREFIX = "786-generated-"

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

export async function findReadyGeneratedPreview(input: {
  projectId: string
  commitSha: string
}): Promise<{ id: string; url: string } | null> {
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
  const ready = payload?.deployments?.find((candidate) =>
    String(candidate.readyState || candidate.state || "").toUpperCase() === "READY" &&
    typeof candidate.url === "string",
  )
  if (!ready || typeof ready.url !== "string") return null
  const id = typeof ready.uid === "string"
    ? ready.uid
    : typeof ready.id === "string"
      ? ready.id
      : ""
  if (!id) return null
  const url = ready.url.startsWith("https://") ? ready.url : `https://${ready.url}`
  if (!url.endsWith(".vercel.app")) return null
  return { id, url }
}
