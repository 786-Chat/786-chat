import { NextResponse } from "next/server"
import { completeRunnerBuild } from "@/lib/786-admin/build-runner-store"

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
    githubBranch?: unknown
    githubCommitSha?: unknown
    githubPrUrl?: unknown
    deploymentUrl?: unknown
  }

  if (!body || typeof body.buildId !== "string") {
    return NextResponse.json({ error: "buildId is required" }, { status: 400 })
  }

  if (body.status !== "passed" && body.status !== "failed" && body.status !== "cancelled") {
    return NextResponse.json({ error: "Invalid build status" }, { status: 400 })
  }

  const updated = await completeRunnerBuild({
    buildId: body.buildId,
    status: body.status,
    logs: typeof body.logs === "string" ? body.logs : "",
    errorMessage: typeof body.errorMessage === "string" ? body.errorMessage : null,
    githubBranch: typeof body.githubBranch === "string" ? body.githubBranch : null,
    githubCommitSha: typeof body.githubCommitSha === "string" ? body.githubCommitSha : null,
    githubPrUrl: typeof body.githubPrUrl === "string" ? body.githubPrUrl : null,
    deploymentUrl: typeof body.deploymentUrl === "string" ? body.deploymentUrl : null,
  })

  if (!updated) {
    return NextResponse.json({ error: "Build not found or already completed" }, { status: 409 })
  }

  return NextResponse.json({ success: true })
}
