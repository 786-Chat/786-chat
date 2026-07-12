import { NextResponse } from "next/server"
import { completeRunnerBuild, getRunnerBuildBundle } from "@/lib/786-admin/build-runner-store"
import { publishGeneratedProjectToGitHub } from "@/lib/786-admin/github-project-publisher"

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
    deploymentUrl?: unknown
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
  let publishingLog = ""

  if (status === "passed") {
    try {
      const bundle = await getRunnerBuildBundle(body.buildId)
      if (!bundle) throw new Error("Validated source bundle is unavailable for GitHub publishing")

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
      publishingLog = [
        "",
        `[publisher] Created branch ${published.branch}.`,
        `[publisher] Commit ${published.commitSha}.`,
        `[publisher] Draft PR ${published.pullRequestUrl}.`,
      ].join("\n")
    } catch (error) {
      status = "failed"
      errorMessage = error instanceof Error ? error.message : "GitHub project publishing failed"
      publishingLog = `\n[publisher] ${errorMessage}\n`
    }
  }

  const logs = `${typeof body.logs === "string" ? body.logs : ""}${publishingLog}`
  const updated = await completeRunnerBuild({
    buildId: body.buildId,
    status,
    logs,
    errorMessage,
    githubBranch,
    githubCommitSha,
    githubPrUrl,
    deploymentUrl: typeof body.deploymentUrl === "string" ? body.deploymentUrl : null,
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
    error: status === "failed" ? errorMessage : null,
  })
}
