import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  createComment,
  listComments,
  setCommentStatus,
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
    return NextResponse.json({ comments: await listComments(id, email) })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not list comments"
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 500 })
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as {
    body?: unknown
    file_path?: unknown
    line_number?: unknown
  }
  if (typeof body.body !== "string" || !body.body.trim()) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 })
  }
  try {
    const { id } = await params
    const comment = await createComment({
      projectId: id,
      email,
      body: body.body,
      filePath: typeof body.file_path === "string" ? body.file_path : null,
      lineNumber: typeof body.line_number === "number" ? body.line_number : null,
    })
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create comment"
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 500 })
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as {
    comment_id?: unknown
    status?: unknown
  }
  if (typeof body.comment_id !== "string" || !["open", "resolved"].includes(String(body.status))) {
    return NextResponse.json({ error: "comment_id and valid status are required" }, { status: 400 })
  }
  try {
    const { id } = await params
    const comment = await setCommentStatus({
      projectId: id,
      commentId: body.comment_id,
      email,
      status: body.status as "open" | "resolved",
    })
    return NextResponse.json({ comment })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update comment"
    const status = message === "Forbidden" ? 403 : message.includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
