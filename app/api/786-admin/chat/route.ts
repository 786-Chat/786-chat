import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { generateProjectCode, type CodegenMode } from "@/lib/786-admin/codegen"
import type { SevenEightSixProject } from "@/lib/786-admin/local-project-generator"

const ALLOWED_MODES = new Set<CodegenMode>([
  "auto",
  "deepseek-flash",
  "deepseek-pro",
  "gemini-flash",
  "gemini-pro",
])
const MAX_MESSAGE_LENGTH = 20_000
const MAX_CONTEXT_FILES = 200
const MAX_CONTEXT_FILE_LENGTH = 80_000

type ExistingInput = {
  title?: string
  description?: string
  fileTree?: string[]
  keyFiles?: Record<string, string>
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48)
}

function safeExisting(value: unknown) {
  if (!value || typeof value !== "object") return undefined
  const input = value as ExistingInput
  if (!Array.isArray(input.fileTree) || !input.keyFiles || typeof input.keyFiles !== "object") {
    return undefined
  }

  return {
    title: String(input.title || "").slice(0, 200),
    description: String(input.description || "").slice(0, 2_000),
    fileTree: input.fileTree.slice(0, MAX_CONTEXT_FILES).map((path) => String(path).slice(0, 500)),
    keyFiles: Object.fromEntries(
      Object.entries(input.keyFiles)
        .slice(0, 20)
        .map(([path, content]) => [String(path).slice(0, 500), String(content).slice(0, MAX_CONTEXT_FILE_LENGTH)])
    ),
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!isAdminUser(session?.email)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const message = String(body?.message || "").trim()
    const requestedMode = String(body?.mode || "auto") as CodegenMode
    const mode: CodegenMode = ALLOWED_MODES.has(requestedMode) ? requestedMode : "auto"

    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required." }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ success: false, error: "Message is too large." }, { status: 413 })
    }

    const projectIdRaw = body?.projectId
    const projectId = typeof projectIdRaw === "string" && projectIdRaw.trim()
      ? projectIdRaw.trim().slice(0, 200)
      : null

    const codegen = await generateProjectCode({
      prompt: message,
      mode,
      existing: safeExisting(body?.existing),
    })

    const now = new Date().toISOString()
    const project: SevenEightSixProject = {
      id: projectId ?? `${slugify(codegen.title) || "project"}-${Date.now()}`,
      title: codegen.title,
      description: codegen.description,
      prompt: message,
      createdAt: now,
      updatedAt: now,
      files: codegen.files,
    }

    return NextResponse.json({
      success: true,
      response: codegen.reply,
      model: codegen.model,
      reason: codegen.reason,
      project,
      fellBackToLocal: false,
    })
  } catch (error) {
    console.error("[786.Chat] code generation failed", error)
    return NextResponse.json(
      {
        success: false,
        error: "786.Chat could not generate project files. Check the configured DeepSeek or Gemini credentials and retry.",
      },
      { status: 503 }
    )
  }
}
