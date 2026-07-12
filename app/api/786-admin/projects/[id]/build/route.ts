import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { createBuildJob, getLatestBuildJob } from "@/lib/786-admin/build-jobs"
import { validateGeneratedProject } from "@/lib/786-admin/build-validation"
import { getProjectWithData } from "@/lib/786-admin/projects"

type Ctx = { params: Promise<{ id: string }> }

async function requireAdminEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) return null
  return email!.toLowerCase().trim()
}

function sourceVersion(files: Record<string, string>): string {
  const canonical = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => `${path}\0${content}`)
    .join("\0")

  return createHash("sha256").update(canonical).digest("hex")
}

export async function GET(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const project = await getProjectWithData(id, email)
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
  }

  const validation = validateGeneratedProject(project.files || {})
  const build = await getLatestBuildJob(id, email)

  return NextResponse.json({
    success: true,
    project: { id: project.id, title: project.title, updated_at: project.updated_at },
    validation,
    build,
  })
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const project = await getProjectWithData(id, email)
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as { confirm?: unknown }
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

  return NextResponse.json(
    {
      success: true,
      ready: true,
      queued: true,
      reused: false,
      project: { id: project.id, title: project.title },
      validation,
      build,
      message: "Build queued successfully.",
    },
    { status: 202 },
  )
}
