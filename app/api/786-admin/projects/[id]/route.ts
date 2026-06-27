import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  deleteProject,
  getProjectWithData,
  persistProjectAtomic,
} from "@/lib/786-admin/projects"
import type {
  AdminMessageRole,
  AdminProjectMetadata,
  AdminProjectPreviewState,
} from "@/lib/786-admin/types"

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
  const project = await getProjectWithData(id, email)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ project })
}

export async function PATCH(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const previewStatePatch =
    body.preview_state && typeof body.preview_state === "object"
      ? (body.preview_state as AdminProjectPreviewState)
      : undefined
  const metadataPatch =
    body.metadata && typeof body.metadata === "object"
      ? (body.metadata as AdminProjectMetadata)
      : undefined
  const files =
    body.files && typeof body.files === "object"
      ? (body.files as Record<string, string>)
      : undefined
  const messages = Array.isArray(body.messages)
    ? (body.messages as Array<{
        role: AdminMessageRole
        content: string
        model?: string | null
        reason?: string | null
      }>)
    : undefined

  try {
    const project = await persistProjectAtomic(email, {
      projectId: id,
      title: typeof body.title === "string" ? body.title : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      prompt: typeof body.prompt === "string" ? body.prompt : undefined,
      kind: typeof body.kind === "string" ? body.kind : undefined,
      preview_state_patch: previewStatePatch,
      metadata_patch: metadataPatch,
      files,
      messages,
    })

    return NextResponse.json({ project })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project update failed"
    const status = message.toLowerCase().includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const deleted = await deleteProject(id, email)
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
