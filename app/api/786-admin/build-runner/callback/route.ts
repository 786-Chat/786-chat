import { NextResponse } from "next/server"
import { completeRunnerBuild, getRunnerBuildBundle } from "@/lib/786-admin/build-runner-store"
import { publishGeneratedProjectToGitHub } from "@/lib/786-admin/github-project-publisher"
import { deployGeneratedProjectToVercel } from "@/lib/786-admin/vercel-project-deployer"

function isAuthorized(request: Request): boolean {
  const secret = process.env.BUILD_RUNNER_SECRET?.trim()
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as null | {
    buildId?: unknown
    status?: unknown
    logs?: unknown
    errorMessage?: unknown
  }

  if (!body || typeof body.buildId !== "string") {
    return NextResponse.json({ error: "buildId is required" }, { status: 400 })
  }

  if (body.status !== "passed" && body.status !== "failed" && body.status !== "cancelled") {
    return NextResponse.json({ error: "Invalid build status" }, { status: 400 })
  }

  let status: "passed" | "failed" | "cancelled" = body.status
  let errorMessage = typeof body.errorMessage === "string" ? body.errorMessage : null
  let githubBranch: string | null = null
  let githubCommitSha: string | null = null
  let githubPrUrl: string | null = null
  let deploymentUrl: string | null = null
  const lifecycleLogs: string[] = []

  if (status === "passed") {
    try {
      const bundle = await getRunnerBuildBundle(body.buildId)
      if (!bundle) throw new Error("Validated source bundle is unavailable for publishing")

      const published = await publishGeneratedProjectToGitHub({
        buildId: bundle.buildId,
        projectId: bundle.projectId,
        title: bundle.title,
        sourceVersion: bundle.sourceVersion,
        files: bundle.files,
      })

      githubBranch = published.branch
      githubCommitSha = published.commitSha
      githubPrUrl = published.pullRequestUrl
      lifecycleLogs.push(
        `[publisher] Created branch ${published.branch}.`,
        `[publisher] Commit ${published.commitSha}.`,
        `[publisher] Draft PR ${published.pullRequestUrl}.`,
      )

      const deployment = await deployGeneratedProjectToVercel({
        projectId: bundle.projectId,
        branch: published.branch,
        commitSha: published.commitSha,
      })
      deploymentUrl = deployment.url
      lifecycleLogs.push(
        `[vercel] Deployment ${deployment.id} queued with state ${deployment.readyState}.`,
        `[vercel] Preview ${deployment.url}.`,
      )
    } catch (error) {
      status = "failed"
      errorMessage = error instanceof Error ? error.message : "Generated project publishing failed"
      lifecycleLogs.push(`[publish/deploy] ${errorMessage}`)
    }
  }

  const suffix = lifecycleLogs.length ? `\n${lifecycleLogs.join("\n")}\n` : ""
  const logs = `${typeof body.logs === "string" ? body.logs : ""}${suffix}`
  const updated = await completeRunnerBuild({
    buildId: body.buildId,
    status,
    logs,
    errorMessage,
    githubBranch,
    githubCommitSha,
    githubPrUrl,
    deploymentUrl,
  })

  if (!updated) {
    return NextResponse.json({ error: "Build not found or already completed" }, { status: 409 })
  }

  return NextResponse.json({
    success: status === "passed",
    status,
    github: githubPrUrl
      ? { branch: githubBranch, commitSha: githubCommitSha, pullRequestUrl: githubPrUrl }
      : null,
    deployment: deploymentUrl ? { url: deploymentUrl } : null,
    error: status === "failed" ? errorMessage : null,
  })
}
