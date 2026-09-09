import { NextResponse } from "next/server"
import {
  completeRunnerBuild,
  getReusableRunnerPublish,
  getRunnerBuildBundle,
  getRunnerPublishProgress,
  recordRunnerPublishProgress,
} from "@/lib/786-admin/build-runner-store"
import { hardenFoodSafetyRuntime } from "@/lib/786-admin/foodsafety-runtime-hardening"
import { publishGeneratedProjectToGitHub } from "@/lib/786-admin/github-project-publisher"
import { runtimeDeploymentFiles } from "@/lib/786-admin/runtime-deployment-files"
import { deployGeneratedProjectToVercel } from "@/lib/786-admin/vercel-project-deployer"
import { repairFailedBuild } from "@/lib/786-chat/build-repair"
import { recordOperationalEvent } from "@/lib/786-chat/monitoring"

export const runtime = "nodejs"
export const maxDuration = 300

const PREVIEW_CALLBACK_DEPLOY_WAIT_MS = 180_000

function isAuthorized(request: Request): boolean {
  const secret = process.env.BUILD_RUNNER_SECRET?.trim()
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

function runtimeFilesDiffer(saved: Record<string, string>, runtimeFiles: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(saved), ...Object.keys(runtimeFiles)])
  for (const key of keys) {
    if ((saved[key] ?? null) !== (runtimeFiles[key] ?? null)) return true
  }
  return false
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

      const deploymentFiles = hardenFoodSafetyRuntime(
        bundle.projectId,
        runtimeDeploymentFiles(bundle.files),
      )
      const hasRuntimeCompatibilityRewrite = runtimeFilesDiffer(bundle.files, deploymentFiles)

      // A callback retry for the same build must reuse its already checkpointed branch,
      // even when runtime-only compatibility/security rewrites make the deployment files
      // differ from the saved project source. This prevents duplicate PRs on slow callbacks.
      const currentPublish = await getRunnerPublishProgress(body.buildId)
      const reusablePublish = currentPublish ?? (
        hasRuntimeCompatibilityRewrite
          ? null
          : await getReusableRunnerPublish({
              projectId: bundle.projectId,
              sourceVersion: bundle.sourceVersion,
              excludeBuildId: bundle.buildId,
            })
      )

      const published = reusablePublish ?? await publishGeneratedProjectToGitHub({
        buildId: bundle.buildId,
        projectId: bundle.projectId,
        title: bundle.title,
        sourceVersion: bundle.sourceVersion,
        files: deploymentFiles,
      })

      githubBranch = published.branch
      githubCommitSha = published.commitSha
      githubPrUrl = published.pullRequestUrl

      const checkpointed = await recordRunnerPublishProgress({
        buildId: body.buildId,
        githubBranch: published.branch,
        githubCommitSha: published.commitSha,
        githubPrUrl: published.pullRequestUrl,
        reused: Boolean(reusablePublish),
      })
      if (!checkpointed) throw new Error("Build publish metadata could not be checkpointed")

      if (currentPublish) {
        lifecycleLogs.push(
          `[publisher] Reused this build's checkpointed publish ${published.pullRequestUrl}; skipped duplicate GitHub upload.`,
        )
      } else if (reusablePublish) {
        lifecycleLogs.push(
          `[publisher] Reused previously published source ${published.pullRequestUrl}; skipped duplicate GitHub upload.`,
        )
      } else if (hasRuntimeCompatibilityRewrite) {
        lifecycleLogs.push("[publisher] Published runtime compatibility files for imported project deployment.")
      }

      // Vercel can spend several minutes tracing a large imported Express/Vite bundle
      // after the application build has already passed. Do not make the runner wait for
      // the deployer's full READY timeout. The project build GET route already reconciles
      // READY and terminal Vercel states by the checkpointed commit SHA.
      const deployment = await Promise.race([
        deployGeneratedProjectToVercel({
          projectId: bundle.projectId,
          branch: published.branch,
          commitSha: published.commitSha,
          files: deploymentFiles,
        }),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), PREVIEW_CALLBACK_DEPLOY_WAIT_MS)
        }),
      ])

      if (!deployment) {
        lifecycleLogs.push(
          "[vercel] Preview is still publishing; normal build polling will reconcile the deployment when it reaches READY or a terminal state.",
        )
        return NextResponse.json(
          {
            success: true,
            status: "running",
            github: {
              branch: githubBranch,
              commitSha: githubCommitSha,
              pullRequestUrl: githubPrUrl,
            },
            deployment: null,
            repair: null,
            error: null,
          },
          { status: 202 },
        )
      }

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
