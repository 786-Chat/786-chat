import { NextResponse } from "next/server"
import { generateProjectCode, type CodegenMode } from "@/lib/786-admin/codegen"
import { createSevenEightSixProjectFromPrompt } from "@/lib/786-admin/local-project-generator"

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 48)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = String(body?.message || "").trim()
    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required." }, { status: 400 })
    }

    const mode = String(body?.mode || "auto") as CodegenMode
    const projectId = typeof body?.projectId === "string" && body.projectId.trim() ? body.projectId.trim() : null

    const raw = body?.existing
    const existing =
      raw && typeof raw === "object" && Array.isArray(raw.fileTree) && raw.keyFiles && typeof raw.keyFiles === "object"
        ? {
            title: String(raw.title || ""),
            description: String(raw.description || ""),
            fileTree: raw.fileTree.map((p: unknown) => String(p)),
            keyFiles: Object.fromEntries(Object.entries(raw.keyFiles).map(([k, v]) => [String(k), String(v)])),
          }
        : undefined

    try {
      const codegen = await generateProjectCode({ prompt: message, mode, existing })
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
          prompt: message,
          createdAt: now,
          updatedAt: now,
          files: codegen.files,
        },
        fellBackToLocal: false,
      })
    } catch (codegenError) {
      console.error("[786.Chat] codegen failed, falling back to local generator", codegenError)
      const fallback = createSevenEightSixProjectFromPrompt(message)
      const project = projectId ? { ...fallback, id: projectId } : fallback
      const msg = codegenError instanceof Error ? codegenError.message : "unknown error"
      return NextResponse.json({
        success: true,
        response: `AI codegen unavailable, returned a fallback template (${msg}). Please retry the prompt.`,
        model: "local-fallback",
        reason: "Emergency fallback: AI codegen failed.",
        project,
        fellBackToLocal: true,
        codegenError: msg,
      })
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "786.Chat request failed." },
      { status: 500 }
    )
  }
}
