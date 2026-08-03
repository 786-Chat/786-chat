import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { deleteProject, getProjectWithData } from "@/lib/786-admin/projects"
import { saveGeneratedProjectAtomic } from "@/lib/786-chat/persistence"
import { validatePersistedGeneration } from "@/lib/786-chat/persistence-validation"

type Context = { params: Promise<{ id: string }> }

async function ownerEmail() {
  const session = await getSession()
  return session?.email ? session.email.toLowerCase().trim() : null
}

export async function GET(_request: Request, { params }: Context) {
  const owner = await ownerEmail()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const project = await getProjectWithData(id, owner)
  return project
    ? NextResponse.json({ project })
    : NextResponse.json({ error: "Project not found." }, { status: 404 })
}

export async function PATCH(request: Request, { params }: Context) {
  const owner = await ownerEmail()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const current = await getProjectWithData(id, owner)
  if (!current) return NextResponse.json({ error: "Project not found." }, { status: 404 })
  const files = body.files && typeof body.files === "object"
    ? body.files as Record<string, string>
    : null
  if (!files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: "A complete generated file set is required." }, { status: 400 })
  }
  const metadata = body.metadata && typeof body.metadata === "object"
    ? body.metadata as Record<string, unknown>
    : current.metadata
  const validation = validatePersistedGeneration(metadata, files)
  if (validation && !validation.valid) {
    return NextResponse.json({
      error: "Generated files no longer match the analysed project specification.",
      validation,
    }, { status: 422 })
  }
  try {
    const project = await saveGeneratedProjectAtomic({
      projectId: id,
      ownerEmail: owner,
      title: typeof body.title === "string" ? body.title : current.title,
      description: typeof body.description === "string" ? body.description : current.description,
      prompt: typeof body.prompt === "string" ? body.prompt : current.prompt,
      files,
      previewState: body.preview_state && typeof body.preview_state === "object"
        ? body.preview_state as Record<string, unknown>
        : current.preview_state,
      metadata,
      messages: Array.isArray(body.messages)
        ? body.messages as Array<{ role: "user" | "assistant" | "system"; content: string; model?: string | null; reason?: string | null }>
        : [],
      revisionLabel: typeof body.revision_label === "string" && body.revision_label.trim()
        ? body.revision_label.trim().slice(0, 160)
        : "Before AI edit",
      revisionSource: typeof body.revision_source === "string" && body.revision_source.trim()
        ? body.revision_source.trim().slice(0, 40)
        : "ai-edit",
      recordGenerationJob: body.record_generation_job !== false,
    })
    return NextResponse.json({ project })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Project transaction failed; nothing was saved.",
    }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const owner = await ownerEmail()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const deleted = await deleteProject(id, owner)
  return deleted
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Project not found." }, { status: 404 })
}
