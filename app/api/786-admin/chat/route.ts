import { NextResponse } from "next/server"
import {
  generateProjectCode,
  type CodegenMode,
  type CodegenResult,
} from "@/lib/786-admin/codegen"
import {
  createSevenEightSixProjectFromPrompt,
  type SevenEightSixProject,
} from "@/lib/786-admin/local-project-generator"

// Subsystem #3 — real prompt-driven file generation.
// Routes the prompt through DeepSeek v4 Pro (via generateProjectCode) and
// returns a real SevenEightSixProject payload to the client. The client
// then persists via /api/786-admin/projects (POST or PATCH), so the
// existing Subsystem #1 ON CONFLICT upsert handles edits with no
// duplicate rows.
//
// The hardcoded local template generator is ONLY used as an emergency
// fallback when generateProjectCode throws.

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

    let codegen: CodegenResult | null = null
    let codegenError: string | null = null

    try {
      codegen = await generateProjectCode({ prompt: message, mode, existing })
    } catch (error) {
      codegenError =
        error instanceof Error ? error.message : "AI codegen failed"
      console.error(
        "[786.Chat] codegen failed, falling back to local generator",
        error
      )
    }

    let project: SevenEightSixProject
    let response: string
    let model: string
    let reason: string
    let fellBackToLocal = false

    // Determine the id we return to the client:
    //   - If projectId was provided → this is an EDIT, reuse the same id so
    //     persistAfterGeneration on the client PATCHes the same Neon row.
    //   - Otherwise → this is a NEW project, mint a fresh id placeholder.
    //     The DB still assigns its own UUID on INSERT; this id is only a
    //     pre-persist placeholder shown in the chat response.
    const now = new Date().toISOString()

    if (codegen) {
      const id =
        projectId ?? `${slugify(codegen.title) || "project"}-${Date.now()}`
      project = {
        id,
        title: codegen.title,
        description: codegen.description,
        prompt: message,
        createdAt: now,
        updatedAt: now,
        files: codegen.files,
      }
      response = codegen.reply
      model = codegen.model
      reason = codegen.reason
    } else {
      fellBackToLocal = true
      const fallback = createSevenEightSixProjectFromPrompt(message)
      // Preserve the existing projectId on edit even when falling back.
      project = projectId ? { ...fallback, id: projectId } : fallback
      response = `AI codegen unavailable, returned a fallback template (${
        codegenError || "unknown error"
      }). Please retry the prompt.`
      model = "local-fallback"
      reason = "Emergency fallback: AI codegen failed."
    }

    return NextResponse.json({
      success: true,
      response,
      model,
      reason,
      project,
      fellBackToLocal,
      codegenError: fellBackToLocal ? codegenError : undefined,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "786.Chat request failed.",
      },
      { status: 500 }
    )
  }
}
