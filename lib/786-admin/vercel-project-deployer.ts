const DEFAULT_REPOSITORY_ID = "1250394192"

export type GeneratedProjectDeployment = {
  id: string
  url: string
  readyState: string
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function safeProjectName(projectId: string): string {
  const suffix = projectId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)
  return `786-generated-${suffix || "project"}`
}

export async function deployGeneratedProjectToVercel(input: {
  projectId: string
  branch: string
  commitSha: string
}): Promise<GeneratedProjectDeployment> {
  const token = requiredEnv("VERCEL_TOKEN")
  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  const repositoryId = process.env.VERCEL_GITHUB_REPOSITORY_ID?.trim() || DEFAULT_REPOSITORY_ID
  const rootDirectory = `generated-projects/${input.projectId}`
  const endpoint = new URL("https://api.vercel.com/v13/deployments")
  if (teamId) endpoint.searchParams.set("teamId", teamId)

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: safeProjectName(input.projectId),
      target: null,
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

  const payload = (await response.json().catch(() => null)) as null | {
    id?: unknown
    url?: unknown
    readyState?: unknown
    error?: { message?: unknown }
  }

  if (!response.ok || !payload || typeof payload.id !== "string" || typeof payload.url !== "string") {
    const detail =
      payload?.error && typeof payload.error.message === "string"
        ? payload.error.message
        : `Vercel deployment request failed with status ${response.status}`
    throw new Error(detail.slice(0, 500))
  }

  const url = payload.url.startsWith("https://") ? payload.url : `https://${payload.url}`
  if (!url.endsWith(".vercel.app")) {
    throw new Error("Vercel returned an untrusted deployment URL")
  }

  return {
    id: payload.id,
    url,
    readyState: typeof payload.readyState === "string" ? payload.readyState : "QUEUED",
  }
}
