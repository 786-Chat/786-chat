import { NextResponse } from "next/server"
import { generateProjectCode, type CodegenMode } from "@/lib/786-admin/codegen"

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = String(body?.message || "").trim()

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "786.Chat request failed."

    console.error("[786.Chat] codegen failed; no fake fallback project was saved", error)

    return NextResponse.json(
      {
        success: false,
        error:
          "786.Chat could not generate real project files. No fake fallback template was saved. Please check DeepSeek/API settings and retry.",
        debug: message,
      },
      { status: 503 }
    )
  }
}
