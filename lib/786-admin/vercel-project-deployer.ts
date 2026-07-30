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

async function waitForReadyDeployment(input: {
  id: string
  token: string
  teamId?: string
}): Promise<string> {
  const deadline = Date.now() + 45_000
  const endpoint = new URL(`https://api.vercel.com/v13/deployments/${input.id}`)
  if (input.teamId) endpoint.searchParams.set("teamId", input.teamId)

  while (Date.now() < deadline) {
    const payload = await deploymentState(endpoint, input.token)
    const state = typeof payload.readyState === "string"
      ? payload.readyState.toUpperCase()
      : "UNKNOWN"
    if (state === "READY") return state
    if (["ERROR", "CANCELED"].includes(state)) {
      throw new Error(`Vercel deployment finished with state ${state}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 2_500))
  }
  throw new Error("Vercel deployment did not become ready within 45 seconds")
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
}): Promise<GeneratedProjectDeployment> {
  const token = requiredEnv("VERCEL_TOKEN")
  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  const repositoryId = process.env.VERCEL_GITHUB_REPOSITORY_ID?.trim() || DEFAULT_REPOSITORY_ID
  const rootDirectory = `generated-projects/${input.projectId}`
  const projectName = safeProjectName(input.projectId)
  const endpoint = new URL("https://api.vercel.com/v13/deployments")
  if (teamId) endpoint.searchParams.set("teamId", teamId)

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

  await allowEmbeddedRuntimePreview({
    projectName,
    token,
    teamId,
  })
  const readyState = await waitForReadyDeployment({
    id: payload.id,
    token,
    teamId,
  })

  return {
    id: payload.id,
    url,
    readyState,
  }
}
