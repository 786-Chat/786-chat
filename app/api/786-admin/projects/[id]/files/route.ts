import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  getFiles,
  getProject,
  upsertFile,
  upsertFiles,
} from "@/lib/786-admin/projects"

async function requireAdminEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) return null
  return email!.toLowerCase().trim()
}

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const project = await getProject(id, email)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const files = await getFiles(id)
  return NextResponse.json({ files })
}

// Accepts either:
//   { files: { "app/page.tsx": "...", ... } }   ← bulk upsert
//   { path: "app/page.tsx", content: "...", language?: "tsx" }   ← single
//
// Both paths use ON CONFLICT (project_id, path) DO UPDATE so editing
// the same path always updates the existing row — never creates a duplicate.
export async function PUT(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const project = await getProject(id, email)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  if (body && typeof body.files === "object" && body.files !== null) {
    const files = body.files as Record<string, string>
    const count = await upsertFiles(id, files)
    return NextResponse.json({ success: true, count })
  }

  const path = String(body.path || "").trim()
  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 })
  }
  const content = typeof body.content === "string" ? body.content : ""
  const language = typeof body.language === "string" ? body.language : null
  await upsertFile(id, { path, content, language })
  return NextResponse.json({ success: true, count: 1 })
}
