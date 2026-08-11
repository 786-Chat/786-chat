import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import {
  createProjectRevision,
  listProjectRevisions,
  restoreProjectRevision,
} from "@/lib/786-admin/project-revisions"
import { getProjectWithData } from "@/lib/786-admin/projects"
import { queueRevisionRebuild } from "@/lib/786-admin/revision-build-refresh"

type Context = { params: Promise<{ id: string }> }

const UNDOABLE_SOURCES = new Set(["ai-edit", "code-editor", "visual-editor", "manual"])

export async function POST(request: Request, { params }: Context) {
  const session = await getSession()
  const owner = session?.email?.toLowerCase().trim()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const revisions = await listProjectRevisions(id, owner, 100)
    const target = revisions.find((revision) => UNDOABLE_SOURCES.has(revision.source))
    if (!target) {
      return NextResponse.json({ error: "There is no earlier user change to undo." }, { status: 409 })
    }

    await createProjectRevision({
      projectId: id,
      ownerEmail: owner,
      label: "Before undo",
      source: "undo-safety",
    })
    const restoredRevision = await restoreProjectRevision({
      revisionId: target.id,
      projectId: id,
      ownerEmail: owner,
    })
    const project = await getProjectWithData(id, owner)
    if (!project) throw new Error("Project not found after undo")

    const buildResponse = await queueRevisionRebuild({ request, projectId: id })
    const buildPayload = await buildResponse.json().catch(() => ({}))
    if (!buildResponse.ok) {
      const buildError = typeof buildPayload?.error === "string"
        ? buildPayload.error
        : "Undone project could not be queued for rebuild"
      throw new Error(buildError)
    }

    return NextResponse.json({
      project,
      restoredRevision,
      build: buildPayload?.build || null,
      rebuildQueued: Boolean(buildPayload?.queued),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The last change could not be undone."
    return NextResponse.json(
      { error: message },
      { status: message.toLowerCase().includes("not found") ? 404 : 500 },
    )
  }
}
