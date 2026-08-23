import { NextResponse } from "next/server"

import { getProjectWithData } from "@/lib/786-admin/projects"
import { getSession } from "@/lib/auth"
import { saveGeneratedProjectAtomic } from "@/lib/786-chat/persistence"
import { validatePersistedGeneration } from "@/lib/786-chat/persistence-validation"
import {
  injectVisualEditorFiles,
  normalizeVisualEditorState,
} from "@/lib/786-chat/visual-editor"

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
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 })
  return NextResponse.json({
    state: normalizeVisualEditorState(project.metadata?.visual_editor),
  })
}

export async function PATCH(request: Request, { params }: Context) {
  const owner = await ownerEmail()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const project = await getProjectWithData(id, owner)
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const incomingState = body.state && typeof body.state === "object"
    ? body.state as Record<string, unknown>
    : {}
  const existingState = normalizeVisualEditorState(project.metadata?.visual_editor)

  // Older builder sessions may save only the original section/style fields. Merge
  // with the persisted state first so Studio text blocks/elements are never lost
  // when a native visual edit is made from a stale browser tab.
  const state = normalizeVisualEditorState({
    ...existingState,
    ...incomingState,
  })
  const files = injectVisualEditorFiles(project.files, state)
  const metadata = { ...(project.metadata || {}), visual_editor: state }
  const validation = validatePersistedGeneration(metadata, files)
  if (validation && !validation.valid) {
    return NextResponse.json({
      error: "The visual edit would invalidate this project.",
      validation,
    }, { status: 422 })
  }

  try {
    const saved = await saveGeneratedProjectAtomic({
      projectId: id,
      ownerEmail: owner,
      title: project.title,
      description: project.description,
      prompt: project.prompt,
      files,
      previewState: {
        ...(project.preview_state || {}),
        active_file: project.preview_state?.active_file || "app/page.tsx",
      },
      metadata,
      messages: [],
      revisionLabel: typeof body.label === "string" && body.label.trim()
        ? body.label.trim().slice(0, 120)
        : "Before visual edit",
      revisionSource: "visual-editor",
      recordGenerationJob: false,
    })
    return NextResponse.json({ project: saved, state })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Visual edit could not be saved.",
    }, { status: 500 })
  }
}
