import { NextResponse } from "next/server"
import {
  generateProjectCode,
  type CodegenAttachment,
  type CodegenMode,
} from "@/lib/786-admin/codegen"
import { OPTIONAL_PROJECT_FEATURE_RULES } from "@/lib/786-admin/optional-feature-rules"

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48)
}

function parseAttachment(value: unknown): CodegenAttachment | undefined {
  if (!value || typeof value !== "object") return undefined

  const raw = value as Record<string, unknown>
  const url = typeof raw.url === "string" ? raw.url.trim() : ""
  const mediaType = typeof raw.mediaType === "string" ? raw.mediaType.trim() : ""
  const name = typeof raw.name === "string" ? raw.name.trim() : undefined

  if (!url || !mediaType) return undefined
  if (!mediaType.startsWith("image/") && mediaType !== "application/pdf") {
    throw new Error("Only images and PDFs are supported.")
  }
  if (!url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("data:")) {
    throw new Error("Attachment URL is invalid.")
  }

  return { url, mediaType, name }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = String(body?.message || "").trim()
    const attachment = parseAttachment(body?.attachment)

    if (!message && !attachment) {
      return NextResponse.json(
        { success: false, error: "Message or attachment is required." },
        { status: 400 }
      )
    }

    const mode = String(body?.mode || "auto") as CodegenMode
    const projectId =
      typeof body?.projectId === "string" && body.projectId.trim()
        ? body.projectId.trim()
        : null

    const raw = body?.existing
    const existing =
      raw &&
      typeof raw === "object" &&
      Array.isArray(raw.fileTree) &&
      raw.keyFiles &&
      typeof raw.keyFiles === "object"
        ? {
            title: String(raw.title || ""),
            description: String(raw.description || ""),
            fileTree: raw.fileTree.map((p: unknown) => String(p)),
            keyFiles: Object.fromEntries(
              Object.entries(raw.keyFiles).map(([k, v]) => [String(k), String(v)])
            ),
          }
        : undefined

    const userRequest = message || "Inspect the attached file and update the existing project to match it."
    const prompt = `${userRequest}\n\n${OPTIONAL_PROJECT_FEATURE_RULES}`
    const codegen = await generateProjectCode({
      prompt,
      mode,
      existing,
      attachment,
    })
    const now = new Date().toISOString()
    const id = projectId ?? `${slugify(codegen.title) || "project"}-${Date.now()}`

    return NextResponse.json({
      success: true,
      response: codegen.reply,
      model: codegen.model,
      reason: codegen.reason,
      project: {
        id,
        title: codegen.title,
        description: codegen.description,
        prompt: userRequest,
        createdAt: now,
        updatedAt: now,
        files: codegen.files,
      },
      fellBackToLocal: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "786.Chat request failed."
    console.error("[786.Chat] codegen failed; no fake fallback project was saved", error)

    return NextResponse.json(
      {
        success: false,
        error: message,
        debug: message,
      },
      { status: 503 }
    )
  }
}
