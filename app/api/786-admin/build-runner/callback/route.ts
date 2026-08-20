import { NextResponse } from "next/server"
import { completeRunnerBuild, getRunnerBuildBundle, recordRunnerPublishProgress } from "@/lib/786-admin/build-runner-store"
import { publishGeneratedProjectToGitHub } from "@/lib/786-admin/github-project-publisher"
import { deployGeneratedProjectToVercel } from "@/lib/786-admin/vercel-project-deployer"
import { repairFailedBuild } from "@/lib/786-chat/build-repair"
import { recordOperationalEvent } from "@/lib/786-chat/monitoring"

export const runtime = "nodejs"
// Publishing a verified build includes GitHub branch/PR creation, generated database
// preparation, Vercel project/env setup and up to 75s waiting for the preview to be
// READY. The callback also checkpoints GitHub publish metadata before waiting on Vercel,
// allowing normal status polling to reconcile a READY preview if this request is cut off.
export const maxDuration = 300

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
  const runnerBuildFailed = body.status === "failed"
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

      const checkpointed = await recordRunnerPublishProgress({
        buildId: body.buildId,
        githubBranch: published.branch,
        githubCommitSha: published.commitSha,
        githubPrUrl: published.pullRequestUrl,
      })
      if (!checkpointed) throw new Error("Build publish metadata could not be checkpointed")

      const deployment = await deployGeneratedProjectToVercel({
        projectId: bundle.projectId,
        branch: published.branch,
        commitSha: published.commitSha,
        files: bundle.files,
      })
      deploymentUrl = deployment.url
      lifecycleLogs.push(
        "[runtime] Generated database namespace prepared and migration applied when required.",
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
    repairStatus: runnerBuildFailed ? "pending" : "not_needed",
  })

  if (!updated) {
    return NextResponse.json({ error: "Build not found or already completed" }, { status: 409 })
  }

  if (status === "failed" || status === "cancelled") {
    await recordOperationalEvent({
      category: "build",
      eventName: status === "failed" ? "generated_build_failed" : "generated_build_cancelled",
      status,
      severity: status === "failed" ? "error" : "warning",
      buildId: body.buildId,
      errorCode: status === "failed" ? "GENERATED_BUILD_FAILED" : "GENERATED_BUILD_CANCELLED",
      error: errorMessage || `Build ${status}`,
      metadata: { repairPending: runnerBuildFailed },
    })
  }

  const repair = runnerBuildFailed
    ? await repairFailedBuild({
        buildId: body.buildId,
        logs,
        baseUrl: new URL(request.url).origin,
      })
    : null

  return NextResponse.json({
    success: status === "passed" || repair?.queued === true,
    status,
    github: githubPrUrl
      ? { branch: githubBranch, commitSha: githubCommitSha, pullRequestUrl: githubPrUrl }
      : null,
    deployment: deploymentUrl ? { url: deploymentUrl } : null,
    repair,
    error: status === "failed" ? errorMessage : null,
  })
}
