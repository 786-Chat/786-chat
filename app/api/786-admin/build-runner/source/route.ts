import { NextResponse } from "next/server"
import { getRunnerBuildBundle } from "@/lib/786-admin/build-runner-store"
import { sql } from "@/lib/786-admin/db"

function isAuthorized(request: Request): boolean {
  const secret = process.env.BUILD_RUNNER_SECRET?.trim()
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const buildId = new URL(request.url).searchParams.get("build_id")?.trim()
  if (!buildId) {
    return NextResponse.json({ error: "build_id is required" }, { status: 400 })
  }

  // Internal GitHub Actions retries can legitimately re-dispatch a build that
  // was already marked failed. Reactivate only that exact authenticated build
  // record so the runner can download the same saved project source and replace
  // the stale failed status with the new verification result.
  await sql`
    UPDATE admin_project_builds
    SET status = 'queued',
        started_at = NULL,
        completed_at = NULL,
        error_message = NULL,
        logs = logs || ${"[runner] Authenticated retry reactivated this failed build.\n"},
        updated_at = NOW()
    WHERE id = ${buildId}
      AND status = 'failed'
  `

  const bundle = await getRunnerBuildBundle(buildId)
  if (!bundle) {
    return NextResponse.json({ error: "Build not found or no longer active" }, { status: 404 })
  }

  return NextResponse.json({ success: true, bundle })
}
