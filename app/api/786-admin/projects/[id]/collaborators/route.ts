import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  listCollaborators,
  removeCollaborator,
  upsertCollaborator,
  type ProjectRole,
} from "@/lib/786-admin/collaboration"

async function requireAdminEmail() {
  const session = await getSession()
  const email = session?.email
  return isAdminUser(email) ? email!.toLowerCase().trim() : null
}

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    return NextResponse.json({ collaborators: await listCollaborators(id, email) })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not list collaborators"
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 500 })
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; role?: unknown }
  const allowed: Array<Exclude<ProjectRole, "owner">> = ["editor", "reviewer", "viewer"]
  if (typeof body.email !== "string" || !allowed.includes(body.role as Exclude<ProjectRole, "owner">)) {
    return NextResponse.json({ error: "Valid email and role are required" }, { status: 400 })
  }
  try {
    const { id } = await params
    const collaborator = await upsertCollaborator({
      projectId: id,
      ownerEmail: email,
      email: body.email,
      role: body.role as Exclude<ProjectRole, "owner">,
    })
    return NextResponse.json({ collaborator }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save collaborator"
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 500 })
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const collaboratorEmail = new URL(request.url).searchParams.get("email")
  if (!collaboratorEmail) return NextResponse.json({ error: "email is required" }, { status: 400 })
  try {
    const { id } = await params
    const removed = await removeCollaborator(id, email, collaboratorEmail)
    return NextResponse.json({ removed })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove collaborator"
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 500 })
  }
}
