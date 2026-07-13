import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  applyAiEditProposal,
  createAiEditProposal,
  listAiEditProposals,
  rejectAiEditProposal,
} from "@/lib/786-admin/ai-edits"

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
  const proposals = await listAiEditProposals(id, email, Number.isFinite(requested) ? requested : 50)
  return NextResponse.json({ proposals }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as {
    prompt?: unknown
    summary?: unknown
    provider?: unknown
    model?: unknown
    changes?: unknown
  }

  try {
    const proposal = await createAiEditProposal({
      projectId: id,
      ownerEmail: email,
      prompt: typeof body.prompt === "string" ? body.prompt : "",
      summary: typeof body.summary === "string" ? body.summary : undefined,
      provider: typeof body.provider === "string" ? body.provider : null,
      model: typeof body.model === "string" ? body.model : null,
      changes: Array.isArray(body.changes) ? body.changes as Array<{ path: string; action?: "upsert" | "delete"; content?: string }> : [],
    })
    return NextResponse.json({ proposal }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create AI edit proposal"
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 400 })
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as {
    proposalId?: unknown
    action?: unknown
    acceptedPaths?: unknown
  }
  if (typeof body.proposalId !== "string") return NextResponse.json({ error: "proposalId is required" }, { status: 400 })

  try {
    if (body.action === "reject") {
      await rejectAiEditProposal(id, body.proposalId, email)
      return NextResponse.json({ rejected: true })
    }
    if (body.action !== "apply") return NextResponse.json({ error: "action must be apply or reject" }, { status: 400 })
    const result = await applyAiEditProposal({
      projectId: id,
      proposalId: body.proposalId,
      ownerEmail: email,
      acceptedPaths: Array.isArray(body.acceptedPaths)
        ? body.acceptedPaths.filter((value): value is string => typeof value === "string")
        : undefined,
    })
    return NextResponse.json(result, { status: result.applied ? 200 : 409 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update AI edit proposal"
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 400 })
  }
}
