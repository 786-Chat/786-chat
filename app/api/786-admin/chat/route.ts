import { NextResponse } from "next/server"
import {
  generateProjectCode,
  type CodegenMode,
} from "@/lib/786-admin/codegen"
import type { SevenEightSixProject } from "@/lib/786-admin/local-project-generator"

// Subsystem #3 — real prompt-driven file generation.
// Routes the prompt through structured AI codegen and returns a real
// SevenEightSixProject payload to the client. The client then persists via
// /api/786-admin/projects (POST or PATCH), so Subsystem #1 ON CONFLICT upsert
// handles edits with no duplicate rows.
//
// IMPORTANT: Do not return local fallback templates from this route. A fallback
// template looks like a successful generated project and can overwrite/save old
// placeholder UI into Neon. If AI codegen fails, fail loudly so no fake preview
// is persisted.

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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = String(body?.message || "").trim()
    const mode = String(body?.mode || "auto") as CodegenMode
    const projectIdRaw = body?.projectId
    const projectId =
      typeof projectIdRaw === "string" && projectIdRaw.trim()
        ? projectIdRaw.trim()
        : null
    const existingRaw: ExistingInput | undefined =
      body?.existing && typeof body.existing === "object"
        ? (body.existing as ExistingInput)
        : undefined

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      )
    }

    const existing =
      existingRaw &&
      Array.isArray(existingRaw.fileTree) &&
      existingRaw.keyFiles &&
      typeof existingRaw.keyFiles === "object"
        ? {
            title: String(existingRaw.title || ""),
            description: String(existingRaw.description || ""),
            fileTree: existingRaw.fileTree.map((p) => String(p)),
            keyFiles: Object.fromEntries(
              Object.entries(existingRaw.keyFiles).map(([k, v]) => [
                String(k),
                String(v),
              ])
            ),
          }
        : undefined

    const codegen = await generateProjectCode({ prompt: message, mode, existing })

    const now = new Date().toISOString()
    const id = projectId ?? `${slugify(codegen.title) || "project"}-${Date.now()}`

    const project: SevenEightSixProject = {
      id,
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
    const message = error instanceof Error ? error.message : "AI codegen failed."

    console.error("[786.Chat] codegen failed; no fallback preview was saved", error)

    return NextResponse.json(
      {
        success: false,
        error:
          "786.Chat could not generate real project files. No fallback template was saved. Please retry after checking the AI provider/API key.",
        debug: message,
      },
      { status: 503 }
    )
  }
}
