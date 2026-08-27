import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  createProjectRevision,
  listProjectRevisions,
} from "@/lib/786-admin/project-revisions"
import {
  getLastSuccessfulPublishedBuild,
  lastSuccessfulPublishedRevision,
} from "@/lib/786-admin/published-source-recovery"

async function requireOwnerEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!email) return null
  return email.toLowerCase().trim()
}

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Ctx) {
  const email = await requireOwnerEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const requested = Number(new URL(request.url).searchParams.get("limit") || 50)
  const safeLimit = Number.isFinite(requested) ? requested : 50
  const [revisions, recoveryBuild] = await Promise.all([
    listProjectRevisions(id, email, safeLimit),
    getLastSuccessfulPublishedBuild(id, email),
  ])
  const recoveryRevision = recoveryBuild ? lastSuccessfulPublishedRevision(recoveryBuild) : null

  return NextResponse.json({
    revisions: recoveryRevision
      ? [recoveryRevision, ...revisions.filter((revision) => revision.id !== recoveryRevision.id)]
      : revisions,
  })
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireOwnerEmail()
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
