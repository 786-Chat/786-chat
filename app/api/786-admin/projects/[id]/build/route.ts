import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  appendBuildLog,
  createBuildJob,
  getLatestBuildJob,
  getLatestPassedBuildJob,
} from "@/lib/786-admin/build-jobs"
import { dispatchGeneratedProjectBuild } from "@/lib/786-admin/build-runner"
import { validateGeneratedProject } from "@/lib/786-admin/build-validation"
import { getProjectWithData } from "@/lib/786-admin/projects"
import { migrateUnsupportedNextConfig } from "@/lib/786-chat/project-compatibility"
import { recordOperationalEvent } from "@/lib/786-chat/monitoring"

type Ctx = { params: Promise<{ id: string }> }

async function requireOwnerEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!email) return null
  return email.toLowerCase().trim()
}

function sourceVersion(files: Record<string, string>): string {
  const canonical = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => `${path}\0${content}`)
    .join("\0")

  return createHash("sha256").update(canonical).digest("hex")
}

export async function GET(_request: Request, { params }: Ctx) {
  const email = await requireOwnerEmail()
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const project = await getProjectWithData(id, email)
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
  }

  const validation = validateGeneratedProject(project.files || {})
  const [build, latestPassedBuild] = await Promise.all([
    getLatestBuildJob(id, email),
    getLatestPassedBuildJob(id, email),
  ])

  return NextResponse.json({
    success: true,
    project: { id: project.id, title: project.title, updated_at: project.updated_at },
    validation,
    build,
    latestPassedBuild,
  })
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireOwnerEmail()
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  let project = await getProjectWithData(id, email)
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as { confirm?: unknown }
  if (body.confirm === true) {
    const migrated = await migrateUnsupportedNextConfig({
      projectId: id,
      ownerEmail: email,
      files: project.files || {},
    })
    if (migrated) {
      project = await getProjectWithData(id, email)
      if (!project) {
        return NextResponse.json({ success: false, error: "Project not found after migration" }, { status: 404 })
      }
    }
  }
  const validation = validateGeneratedProject(project.files || {})

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: "Project is not ready to build.",
        validation,
      },
      { status: 422 },
    )
  }

  if (body.confirm !== true) {
    return NextResponse.json({
      success: true,
      ready: true,
      queued: false,
      project: { id: project.id, title: project.title },
      validation,
      message: "Static validation passed. Send confirm=true to queue the build.",
    })
  }

  const version = sourceVersion(project.files || {})
  const latest = await getLatestBuildJob(id, email)

  if (
    latest &&
    latest.source_version === version &&
    (latest.status === "queued" || latest.status === "running")
  ) {
    return NextResponse.json({
      success: true,
      ready: true,
      queued: true,
      reused: true,
      project: { id: project.id, title: project.title },
      validation,
      build: latest,
      message: "An active build already exists for this project version.",
    })
  }

  const build = await createBuildJob({
    projectId: id,
    ownerEmail: email,
    packageManager: validation.packageManager,
    commands: validation.commands,
    sourceVersion: version,
  })

  try {
    const runner = await dispatchGeneratedProjectBuild({
      buildId: build.id,
      projectId: id,
      baseUrl: new URL(request.url).origin,
    })
    await appendBuildLog({
      buildId: build.id,
      line: `[dispatcher] Sent to ${runner.repository}/${runner.workflow} on ${runner.ref}.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not dispatch isolated build"
    await appendBuildLog({
      buildId: build.id,
      line: `[dispatcher] ${message}`,
      status: "failed",
      errorMessage: message,
    })
    await recordOperationalEvent({
      category: "build",
      eventName: "build_dispatch_failed",
      status: "failed",
      severity: "error",
      ownerEmail: email,
      projectId: id,
      buildId: build.id,
      errorCode: "BUILD_DISPATCH_FAILED",
      error: message,
    })

    return NextResponse.json(
      {
        success: false,
        ready: true,
        queued: false,
        error: message,
        validation,
        build: { ...build, status: "failed", error_message: message },
      },
      { status: 503 },
    )
  }

  return NextResponse.json(
    {
      success: true,
      ready: true,
      queued: true,
      reused: false,
      project: { id: project.id, title: project.title },
      validation,
      build,
      message: "Build queued on the isolated GitHub Actions runner.",
    },
    { status: 202 },
  )
}
