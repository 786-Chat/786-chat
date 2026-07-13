import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  createProjectRevision,
  listProjectRevisions,
} from "@/lib/786-admin/project-revisions"

async function requireAdminEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) return null
  return email!.toLowerCase().trim()
}

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const requested = Number(new URL(request.url).searchParams.get("limit") || 50)
  const revisions = await listProjectRevisions(id, email, Number.isFinite(requested) ? requested : 50)
  return NextResponse.json({ revisions })
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as { label?: unknown; source?: unknown }

  try {
    const revision = await createProjectRevision({
      projectId: id,
      ownerEmail: email,
      label: typeof body.label === "string" ? body.label : "Manual checkpoint",
      source: typeof body.source === "string" ? body.source : "manual",
    })
    return NextResponse.json({ revision }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create revision"
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 500 })
  }
}
