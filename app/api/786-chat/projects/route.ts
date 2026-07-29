import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { listProjects } from "@/lib/786-admin/projects"
import { saveGeneratedProjectAtomic } from "@/lib/786-chat/persistence"

async function ownerEmail() {
  const session = await getSession()
  return isAdminUser(session?.email) ? session!.email!.toLowerCase().trim() : null
}

export async function GET() {
  const owner = await ownerEmail()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ projects: await listProjects(owner) })
}

export async function POST(request: Request) {
  const owner = await ownerEmail()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const title = String(body.title || "").trim()
  const files = body.files && typeof body.files === "object"
    ? body.files as Record<string, string>
    : {}
  if (!title || Object.keys(files).length === 0) {
    return NextResponse.json({ error: "A title and generated files are required." }, { status: 400 })
  }
  try {
    const project = await saveGeneratedProjectAtomic({
      ownerEmail: owner,
      title,
      description: String(body.description || ""),
      prompt: String(body.prompt || ""),
      files,
      previewState: body.preview_state && typeof body.preview_state === "object"
        ? body.preview_state as Record<string, unknown>
        : {},
      metadata: body.metadata && typeof body.metadata === "object"
        ? body.metadata as Record<string, unknown>
        : {},
      messages: Array.isArray(body.messages)
        ? body.messages as Array<{ role: "user" | "assistant" | "system"; content: string; model?: string | null; reason?: string | null }>
        : [],
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Project transaction failed; nothing was saved.",
    }, { status: 500 })
  }
}
