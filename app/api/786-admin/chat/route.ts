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

const DESIGN_PROFILES = [
  {
    name: "editorial-sand",
    instruction: "Use an asymmetric editorial composition with warm sand, ink and coral, strong serif display headings, thin rules, offset media and generous whitespace.",
    css: "--project-primary:#e76f51;--project-secondary:#264653;--project-surface:#f4eadb;--project-ink:#172126;",
  },
  {
    name: "aurora-glass",
    instruction: "Use a deep navy aurora interface with cyan and violet highlights, translucent layered cards, soft glows, rounded geometry and luminous gradients.",
    css: "--project-primary:#22d3ee;--project-secondary:#8b5cf6;--project-surface:#071426;--project-ink:#eefcff;",
  },
  {
    name: "industrial-grid",
    instruction: "Use an industrial data-grid style with charcoal surfaces, lime and amber accents, condensed headings, sharp borders and modular dashboard blocks.",
    css: "--project-primary:#a3e635;--project-secondary:#f59e0b;--project-surface:#121416;--project-ink:#f7fee7;",
  },
  {
    name: "monochrome-electric",
    instruction: "Use a minimal monochrome system with white and near-black surfaces, one electric-blue accent, oversized typography, crisp spacing and restrained motion.",
    css: "--project-primary:#2563eb;--project-secondary:#111827;--project-surface:#f8fafc;--project-ink:#050505;",
  },
  {
    name: "organic-premium",
    instruction: "Use an organic premium composition with cream, forest green and terracotta, soft curves, tactile cards, botanical shapes and calm editorial typography.",
    css: "--project-primary:#2f6b4f;--project-secondary:#c96f4a;--project-surface:#f7f0df;--project-ink:#173127;",
  },
  {
    name: "luxury-burgundy",
    instruction: "Use a cinematic luxury-dark composition with black and burgundy surfaces, muted gold accents, elegant serif headings, refined borders and dramatic spacing.",
    css: "--project-primary:#c9a45c;--project-secondary:#7f1d1d;--project-surface:#10080b;--project-ink:#fff7e6;",
  },
  {
    name: "playful-modular",
    instruction: "Use a playful modular design with cobalt, sunny yellow and pink, bold rounded typography, offset cards, sticker-like details and energetic interactions.",
    css: "--project-primary:#2563eb;--project-secondary:#facc15;--project-surface:#fff8e7;--project-ink:#172554;",
  },
  {
    name: "soft-professional",
    instruction: "Use a soft professional workspace with slate and teal plus lavender accents, balanced grids, subtle shadows and clean humanist typography.",
    css: "--project-primary:#0f766e;--project-secondary:#8b5cf6;--project-surface:#f1f5f9;--project-ink:#172033;",
  },
] as const

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

function hashText(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function designIdentity(projectId: string | null) {
  const seed = projectId || crypto.randomUUID()
  const profile = DESIGN_PROFILES[hashText(seed) % DESIGN_PROFILES.length]
  return { seed, profile }
}

function uniqueDesignRules(seed: string, profile: (typeof DESIGN_PROFILES)[number]) {
  return `
PROJECT DESIGN IDENTITY — MANDATORY FOR THIS PROJECT:
- UNIQUE_DESIGN_ID: ${seed}
- DESIGN_PROFILE: ${profile.name}
- ${profile.instruction}
- Build a project-specific visual system rather than a category starter template.
- Do not reuse another project's colour palette, hero composition, navigation pattern, card style, typography pairing, section order, CTA wording, background treatment, component names, sample content or decorative motifs.
- The layout must clearly differ from other restaurant, school, SaaS, dashboard, quiz, login and shop projects, even when the business category is the same.
- Keep this identity consistent across every generated page and component.
`
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

function addResponsiveSafety(
  files: Record<string, string>,
  profile?: (typeof DESIGN_PROFILES)[number]
): Record<string, string> {
  const next = { ...files }
  const cssPath = next["app/globals.css"] !== undefined
    ? "app/globals.css"
    : next["src/app/globals.css"] !== undefined
      ? "src/app/globals.css"
      : null

  if (cssPath && !next[cssPath].includes("786.Chat responsive safety layer")) {
    next[cssPath] = `${next[cssPath].trimEnd()}${RESPONSIVE_SAFETY_CSS}`
  }

  if (cssPath && profile && !next[cssPath].includes("786.Chat project design identity")) {
    next[cssPath] = `${next[cssPath].trimEnd()}\n\n/* 786.Chat project design identity: ${profile.name} */\n:root { ${profile.css} }\n`
  }

  return next
}

function localResponse(
  userRequest: string,
  projectId: string | null,
  reason: string,
  profile: (typeof DESIGN_PROFILES)[number]
) {
  const local = createSevenEightSixProjectFromPrompt(userRequest)
  const now = new Date().toISOString()
  const id = projectId ?? local.id

  return NextResponse.json({
    success: true,
    response: `${local.title} created with a separate ${profile.name} design identity, working files, interactive UI, responsive layout, demo data, and database schema. You can continue editing this project in chat.`,
    model: "786-chat-safe-generator",
    reason,
    project: {
      id,
      title: local.title,
      description: local.description,
      prompt: userRequest,
      createdAt: now,
      updatedAt: now,
      files: addResponsiveSafety(local.files, profile),
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
    const existing = safeExisting(body.existing)
    const identity = designIdentity(projectId)

    const userRequest = message || "Inspect the attached file and update the existing project to match it."
    const newProjectRules = existing
      ? "Preserve the existing project's established visual identity. Do not replace it with a starter theme unless the user explicitly requests a full redesign."
      : uniqueDesignRules(identity.seed, identity.profile)
    const prompt = `${userRequest}\n\n${newProjectRules}\n\n${OPTIONAL_PROJECT_FEATURE_RULES}\n\n${RESPONSIVE_PROJECT_RULES}`

    try {
      const codegen = await Promise.race([
        generateProjectCode({
          prompt,
          mode,
          existing,
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
        designIdentity: identity.profile.name,
        project: {
          id,
          title: codegen.title,
          description: codegen.description,
          prompt: userRequest,
          createdAt: now,
          updatedAt: now,
          files: addResponsiveSafety(codegen.files, existing ? undefined : identity.profile),
        },
        fellBackToLocal: false,
      })
    } catch (generationError) {
      const reason = generationError instanceof Error ? generationError.message : "AI generation failed."
      console.error("[786.Chat] AI codegen failed; returning safe working project", generationError)
      return localResponse(userRequest, projectId, reason, identity.profile)
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
