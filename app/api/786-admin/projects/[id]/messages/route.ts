import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { appendMessage, getMessages, getProject } from "@/lib/786-admin/projects"
import type { AdminMessageRole } from "@/lib/786-admin/types"

const VALID_ROLES: AdminMessageRole[] = ["user", "assistant", "system"]

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

  const messages = await getMessages(id)
  return NextResponse.json({ messages })
}

export async function POST(request: Request, { params }: Ctx) {
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
  const role = body.role as AdminMessageRole
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content.trim() : ""
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 })
  }

  const message = await appendMessage(id, {
    role,
    content,
    model: typeof body.model === "string" ? body.model : null,
    reason: typeof body.reason === "string" ? body.reason : null,
  })

  return NextResponse.json({ message }, { status: 201 })
}
