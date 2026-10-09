import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { deleteProjectRevision } from "@/lib/786-admin/project-revisions"

type Ctx = { params: Promise<{ id: string; revisionId: string }> }

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, revisionId } = await params
  if (revisionId === "last-successful-published") {
    return NextResponse.json({ error: "Published recovery cannot be deleted." }, { status: 403 })
  }
  try {
    await deleteProjectRevision({ projectId: id, revisionId, ownerEmail: session.email })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete revision"
    const status = message.includes("not found") ? 404 : message.includes("protected") ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
