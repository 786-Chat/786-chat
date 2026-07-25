import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  generateProjectCode,
  type CodegenMode,
} from "@/lib/786-admin/codegen"
import { parseAttachments } from "@/lib/786-admin/attachment-validation"
import { createSevenEightSixProjectFromPrompt } from "@/lib/786-admin/local-project-generator"
import { OPTIONAL_PROJECT_FEATURE_RULES } from "@/lib/786-admin/optional-feature-rules"

export const runtime = "nodejs"
export const maxDuration = 60

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

const RESPONSIVE_PROJECT_RULES = `
RESPONSIVE LAYOUT QUALITY — MANDATORY:
- Every page must work at 320px, 375px, 390px, 414px, 768px, 820px, 1024px, 1366px, and wide desktop sizes.
- Never use a fixed page width that can exceed the viewport. Use w-full, max-w-*, min-w-0, flex-wrap, responsive grids, and responsive padding.
- Every flex or grid child that contains text, cards, charts, forms, or tables must be allowed to shrink with min-w-0.
- Text must wrap safely. Use break-words or overflow-wrap:anywhere for long names, email addresses, IDs, URLs, labels, and headings.
- Images, videos, SVGs, canvases, and iframes must use max-width:100% and height:auto unless a deliberate responsive aspect ratio is used.
- Tables and dense data must be placed inside an overflow-x-auto wrapper. Do not let tables widen the whole page.
- Navigation, toolbars, filters, form rows, metric cards, and action buttons must wrap or stack on narrow screens.
- Large desktop grids must collapse progressively: one column on mobile, suitable tablet columns, then desktop columns.
- Do not use fixed left margins, negative offsets, absolute positioning, or fixed pixel widths that cut content on mobile or iPad.
- Modals, drawers, cards, forms, and panels must use max-w-[calc(100vw-...)] or responsive width classes and remain fully reachable.
- The document must not have horizontal page scrolling. Only intentional local containers such as tables or code blocks may scroll horizontally.
- Verify all borders, card contents, buttons, badges, inputs, charts, and text remain inside their parent at every target width.
- Preserve all functionality while making layouts responsive. Do not hide important content merely to avoid overflow.
`

const RESPONSIVE_SAFETY_CSS = `

/* 786.Chat responsive safety layer */
html, body { max-width: 100%; overflow-x: hidden; }
*, *::before, *::after { box-sizing: border-box; min-width: 0; }
img, video, svg, canvas, iframe { max-width: 100%; height: auto; }
pre, code { max-width: 100%; overflow-wrap: anywhere; }
table { max-width: 100%; }
input, select, textarea, button { max-width: 100%; }
p, h1, h2, h3, h4, h5, h6, a, span, label, td, th { overflow-wrap: anywhere; }
@media (max-width: 767px) {
  [class*="grid-cols-"] { grid-template-columns: minmax(0, 1fr); }
  [class*="min-w-["], [class*="w-["] { max-width: 100%; }
}
`

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48)
}

function timeout<T>(ms: number): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("AI generation timed out before Vercel could finish.")), ms)
  })
}

function safeExisting(value: unknown) {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.fileTree) || !raw.keyFiles || typeof raw.keyFiles !== "object") {
    return undefined
  }

  return {
    title: String(raw.title || "").slice(0, 200),
    description: String(raw.description || "").slice(0, 2_000),
    fileTree: raw.fileTree
      .slice(0, MAX_CONTEXT_FILES)
      .map((path) => String(path).slice(0, 500)),
    keyFiles: Object.fromEntries(
      Object.entries(raw.keyFiles as Record<string, unknown>)
        .slice(0, 20)
        .map(([path, content]) => [
          String(path).slice(0, 500),
          String(content).slice(0, MAX_CONTEXT_FILE_LENGTH),
        ])
    ),
  }
}

function addResponsiveSafety(files: Record<string, string>): Record<string, string> {
  const next = { ...files }
  const cssPath = next["app/globals.css"] !== undefined
    ? "app/globals.css"
    : next["src/app/globals.css"] !== undefined
      ? "src/app/globals.css"
      : null

  if (cssPath && !next[cssPath].includes("786.Chat responsive safety layer")) {
    next[cssPath] = `${next[cssPath].trimEnd()}${RESPONSIVE_SAFETY_CSS}`
  }

  return next
}

function localResponse(userRequest: string, projectId: string | null, reason: string) {
  const local = createSevenEightSixProjectFromPrompt(userRequest)
  const now = new Date().toISOString()
  const id = projectId ?? local.id

  return NextResponse.json({
    success: true,
    response: `${local.title} created with working files, interactive UI, responsive layout, demo data, and database schema. You can continue editing this project in chat.`,
    model: "786-chat-safe-generator",
    reason,
    project: {
      id,
      title: local.title,
      description: local.description,
      prompt: userRequest,
      createdAt: now,
      updatedAt: now,
      files: addResponsiveSafety(local.files),
    },
    fellBackToLocal: true,
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
    const attachments = parseAttachments(body)

    if (!message && attachments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Message or attachment is required." },
        { status: 400 }
      )
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ success: false, error: "Message is too large." }, { status: 413 })
    }

    const requestedMode = String(body.mode || "auto") as CodegenMode
    const mode: CodegenMode = ALLOWED_MODES.has(requestedMode) ? requestedMode : "auto"
    const projectId =
      typeof body.projectId === "string" && body.projectId.trim()
        ? body.projectId.trim().slice(0, 200)
        : null

    const userRequest = message || "Inspect the attached file and update the existing project to match it."
    const prompt = `${userRequest}\n\n${OPTIONAL_PROJECT_FEATURE_RULES}\n\n${RESPONSIVE_PROJECT_RULES}`

    try {
      const codegen = await Promise.race([
        generateProjectCode({
          prompt,
          mode,
          existing: safeExisting(body.existing),
          attachments,
        }),
        timeout<Awaited<ReturnType<typeof generateProjectCode>>>(52_000),
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
          files: addResponsiveSafety(codegen.files),
        },
        fellBackToLocal: false,
      })
    } catch (generationError) {
      const reason = generationError instanceof Error ? generationError.message : "AI generation failed."
      console.error("[786.Chat] AI codegen failed; returning safe working project", generationError)
      return localResponse(userRequest, projectId, reason)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "786.Chat request failed."
    const isValidationError = /attachment|supported|maximum|too large|invalid/i.test(message)
    console.error("[786.Chat] request failed", error)
    return NextResponse.json(
      {
        success: false,
        error: isValidationError ? message : "786.Chat request failed. Please check the request and try again.",
      },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
