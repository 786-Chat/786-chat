const DEFAULT_REPOSITORY = "786-Chat/786-chat"
const DEFAULT_WORKFLOW = "generated-project-build.yml"

export type BuildDispatchResult = {
  repository: string
  workflow: string
  ref: string
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

export async function dispatchGeneratedProjectBuild(input: {
  buildId: string
  projectId: string
}): Promise<BuildDispatchResult> {
  const token = requiredEnv("GITHUB_BUILD_TOKEN")
  requiredEnv("BUILD_RUNNER_SECRET")

  const repository = process.env.GITHUB_BUILD_REPOSITORY?.trim() || DEFAULT_REPOSITORY
  const workflow = process.env.GITHUB_BUILD_WORKFLOW?.trim() || DEFAULT_WORKFLOW
  const ref = process.env.GITHUB_BUILD_REF?.trim() || "agent/phase-3-publishing-v2"
  const baseUrl = requiredEnv("PRODUCTION_BASE_URL").replace(/\/$/, "")

  const response = await fetch(
    `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        ref,
        inputs: {
          build_id: input.buildId,
          project_id: input.projectId,
          base_url: baseUrl,
        },
      }),
      cache: "no-store",
    },
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(
      `Could not dispatch isolated build (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
    )
  }

  return { repository, workflow, ref }
}
