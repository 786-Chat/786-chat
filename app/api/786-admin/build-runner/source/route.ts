import { NextResponse } from "next/server"
import { getRunnerBuildBundle } from "@/lib/786-admin/build-runner-store"
import { sql } from "@/lib/786-admin/db"

function isAuthorized(request: Request): boolean {
  const secret = process.env.BUILD_RUNNER_SECRET?.trim()
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

function normalizeRuntimeDependencies(files: Record<string, string>): void {
  const packageSource = files["package.json"]
  if (!packageSource) return

  const needsVercelBlob = Object.entries(files).some(([path, content]) =>
    path !== "package-lock.json" && content.includes("@vercel/blob"),
  )
  if (!needsVercelBlob) return

  try {
    const pkg = JSON.parse(packageSource) as {
      dependencies?: Record<string, string>
    }
    if (pkg.dependencies?.["@vercel/blob"]) return
    pkg.dependencies = {
      ...(pkg.dependencies || {}),
      "@vercel/blob": "^2.4.0",
    }
    files["package.json"] = `${JSON.stringify(pkg, null, 2)}\n`
  } catch {
    // Leave malformed package metadata to the normal validation/build error path.
  }
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

  // Imported Replit projects can contain the Vercel object-storage compatibility
  // code while their saved package metadata predates that repair. Normalize the
  // isolated runner bundle only; the following workflow lockfile-sync step will
  // then install the dependency before esbuild runs.
  normalizeRuntimeDependencies(bundle.files)

  return NextResponse.json({ success: true, bundle })
}
