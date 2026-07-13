import { NextResponse } from "next/server"
import { getRunnerBuildBundle } from "@/lib/786-admin/build-runner-store"

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

  const bundle = await getRunnerBuildBundle(buildId)
  if (!bundle) {
    return NextResponse.json({ error: "Build not found or no longer active" }, { status: 404 })
  }

  return NextResponse.json({ success: true, bundle })
}
