import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  createProject,
  listProjects,
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

export async function GET() {
  const email = await requireAdminEmail()
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const projects = await listProjects(email)
  return NextResponse.json({ projects })
}

export async function POST(request: Request) {
  const email = await requireAdminEmail()
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const title = String(body.title || "").trim()
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

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

  if (files || messages) {
    try {
      const project = await persistProjectAtomic(email, {
        title,
        description: typeof body.description === "string" ? body.description : "",
        prompt: typeof body.prompt === "string" ? body.prompt : "",
        preview_state_patch: previewStatePatch,
        metadata_patch: metadataPatch,
        files,
        messages,
      })
      return NextResponse.json({ project }, { status: 201 })
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Atomic create failed; nothing was saved.",
        },
        { status: 500 }
      )
    }
  }

  const project = await createProject(email, {
    title,
    description: typeof body.description === "string" ? body.description : "",
    prompt: typeof body.prompt === "string" ? body.prompt : "",
    preview_state: previewStatePatch ?? {},
    metadata: metadataPatch ?? {},
  })

  return NextResponse.json({ project }, { status: 201 })
}
