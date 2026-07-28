import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { generateProjectCode, type CodegenMode } from "@/lib/786-admin/codegen"
import { createPremiumFallbackProject } from "@/lib/786-admin/premium-fallback-generator"

export const runtime = "nodejs"
export const maxDuration = 60

const ALLOWED_MODES = new Set<CodegenMode>([
  "deepseek-flash",
  "deepseek-pro",
])

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 48)
}

function timeout<T>(ms: number): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Compact AI generation timed out before Vercel could finish.")), ms)
  })
}

function fallbackResponse(message: string, projectId: string | null, reason: string) {
  const local = createPremiumFallbackProject(message)
  const now = new Date().toISOString()
  return NextResponse.json({
    success: true,
    response: "A limited local fallback was used because the compact DeepSeek request could not finish.",
    model: "786-chat-premium-fallback",
    reason,
    project: {
      id: projectId ?? local.id,
      title: local.title,
      description: local.description,
      prompt: message,
      createdAt: now,
      updatedAt: now,
      files: local.files,
    },
    fellBackToLocal: true,
    generationProfile: "compact-website",
  })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!isAdminUser(session?.email)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const message = String(body.message || "").trim()
    const requestedMode = String(body.mode || "deepseek-pro") as CodegenMode
    const mode: CodegenMode = ALLOWED_MODES.has(requestedMode) ? requestedMode : "deepseek-pro"
    const projectId = typeof body.projectId === "string" && body.projectId.trim()
      ? body.projectId.trim().slice(0, 200)
      : null
    const seed = typeof body.designSeed === "string" && body.designSeed.trim()
      ? body.designSeed.trim().slice(0, 200)
      : projectId || crypto.randomUUID()

    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required." }, { status: 400 })
    }

    if (body.existing || (Array.isArray(body.attachments) && body.attachments.length > 0)) {
      return NextResponse.json({ success: false, error: "Compact generation only supports new text-only website projects." }, { status: 400 })
    }

    const prompt = `${message}

COMPACT WEBSITE GENERATION PROFILE:
- Generate a complete Next.js App Router project with TypeScript and Tailwind CSS.
- Return app/page.tsx, app/layout.tsx, app/globals.css and every requested app/<route>/page.tsx file.
- Every internal navigation link must have a matching page file.
- Honour the requested colours, industry, pages and content exactly.
- Create a distinctive navigation, hero, page rhythm, typography and card geometry.
- Do not default to purple, generic 786 artwork, placeholder text or a repeated template.
- Use real industry-specific copy and visible content on every route.
- Keep code self-contained, responsive and immediately previewable.
- Do not add admin/editor components or unrelated business modules.
- UNIQUE_DESIGN_ID: ${seed}`

    try {
      const codegen = await Promise.race([
        generateProjectCode({ prompt, mode }),
        timeout<Awaited<ReturnType<typeof generateProjectCode>>>(50_000),
      ])
      const now = new Date().toISOString()
      return NextResponse.json({
        success: true,
        response: codegen.reply,
        model: codegen.model,
        reason: `${codegen.reason} Compact website profile used.`,
        project: {
          id: projectId ?? `${slugify(codegen.title) || "project"}-${Date.now()}`,
          title: codegen.title,
          description: codegen.description,
          prompt: message,
          createdAt: now,
          updatedAt: now,
          files: codegen.files,
        },
        fellBackToLocal: false,
        generationProfile: "compact-website",
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Compact DeepSeek generation failed."
      console.error("[786.Chat] compact generation failed", error)
      return fallbackResponse(message, projectId, reason)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compact generation request failed."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
