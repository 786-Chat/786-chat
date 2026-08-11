import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { undoLatestProjectChange } from "@/lib/786-admin/project-revisions"
import { queueRevisionRebuild } from "@/lib/786-admin/revision-build-refresh"

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  const session = await getSession()
  const owner = session?.email?.toLowerCase().trim()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  try {
    const result = await undoLatestProjectChange({
      projectId: id,
      ownerEmail: owner,
      message: typeof body.message === "string" ? body.message : undefined,
    })
    if (!result) {
      return NextResponse.json({ error: "There is no earlier saved change to undo." }, { status: 409 })
    }

    const buildResponse = await queueRevisionRebuild({ request, projectId: id })
    const buildPayload = await buildResponse.json().catch(() => ({}))
    if (!buildResponse.ok) {
      const buildError = typeof buildPayload?.error === "string"
        ? buildPayload.error
        : "Undone project could not be queued for rebuild"
      throw new Error(buildError)
    }

    return NextResponse.json({
      ...result,
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
