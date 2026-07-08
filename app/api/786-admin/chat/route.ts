import { NextResponse } from "next/server"
import {
  generateProjectCode,
  type CodegenAttachment,
  type CodegenMode,
} from "@/lib/786-admin/codegen"
import { createSevenEightSixProjectFromPrompt } from "@/lib/786-admin/local-project-generator"
import { OPTIONAL_PROJECT_FEATURE_RULES } from "@/lib/786-admin/optional-feature-rules"

export const runtime = "nodejs"
export const maxDuration = 60

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

function timeout<T>(ms: number): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("AI generation timed out before Vercel could finish. A local working project was created instead.")), ms)
  })
}

function localResponse(userRequest: string, projectId: string | null, reason: string) {
  const local = createSevenEightSixProjectFromPrompt(userRequest)
  const now = new Date().toISOString()
  const id = projectId ?? local.id

  return NextResponse.json({
    success: true,
    response: `${local.title} created as a working local project because the AI provider did not return valid JSON in time. You can continue editing this project in chat.`,
    model: "local-safe-generator",
    reason,
    project: {
      id,
      title: local.title,
      description: local.description,
      prompt: userRequest,
      createdAt: now,
      updatedAt: now,
      files: local.files,
    },
    fellBackToLocal: true,
  })
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

    try {
      const codegen = await Promise.race([
        generateProjectCode({
          prompt,
          mode,
          existing,
          attachments: attachment ? [attachment] : [],
        }),
        timeout<Awaited<ReturnType<typeof generateProjectCode>>>(52000),
      ])

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
    } catch (generationError) {
      const reason = generationError instanceof Error ? generationError.message : "AI generation failed."
      console.error("[786.Chat] AI codegen failed; returning local working project", generationError)
      return localResponse(userRequest, projectId, reason)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "786.Chat request failed."
    console.error("[786.Chat] request failed", error)

    return NextResponse.json(
      {
        success: false,
        error: message,
        debug: message,
      },
      { status: 500 }
    )
  }
}
