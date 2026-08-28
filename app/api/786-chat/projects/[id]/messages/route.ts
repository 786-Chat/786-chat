import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { appendMessage, getProjectWithData } from "@/lib/786-admin/projects"

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  const session = await getSession()
  if (!session?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const ownerEmail = session.email.toLowerCase().trim()
  const project = await getProjectWithData(id, ownerEmail)
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    messages?: Array<{
      role?: unknown
      content?: unknown
      model?: unknown
      reason?: unknown
    }>
  }
  const messages = Array.isArray(body.messages) ? body.messages : []
  for (const message of messages.slice(0, 4)) {
    const role = message.role === "assistant" || message.role === "system" ? message.role : "user"
    const content = typeof message.content === "string" ? message.content.trim() : ""
    if (!content) continue
    await appendMessage(id, {
      role,
      content,
      model: typeof message.model === "string" ? message.model : null,
      reason: typeof message.reason === "string" ? message.reason : null,
    })
  }

  const saved = await getProjectWithData(id, ownerEmail)
  return NextResponse.json({ project: saved })
}
