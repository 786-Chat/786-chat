import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { validateGeneratedProject } from "@/lib/786-admin/build-validation"
import { getProjectWithData } from "@/lib/786-admin/projects"

type Ctx = { params: Promise<{ id: string }> }

async function requireAdminEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) return null
  return email!.toLowerCase().trim()
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
  return NextResponse.json({
    success: true,
    project: { id: project.id, title: project.title, updated_at: project.updated_at },
    validation,
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

  return NextResponse.json({
    success: true,
    ready: body.confirm === true,
    project: { id: project.id, title: project.title },
    validation,
    message:
      body.confirm === true
        ? "Static validation passed. The project is ready for the isolated build runner."
        : "Static validation passed. Confirm to queue an isolated build in the next Phase 3 step.",
  })
}
