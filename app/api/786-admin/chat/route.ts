import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { generateProjectCode, type CodegenMode } from "@/lib/786-admin/codegen"
import { parseAttachments } from "@/lib/786-admin/attachment-validation"
import { createPremiumFallbackProject } from "@/lib/786-admin/premium-fallback-generator"
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
  { name: "editorial-sand", instruction: "Use an asymmetric editorial composition with warm sand, ink and coral, serif display headings, thin rules, offset media and magazine-style sections." },
  { name: "aurora-glass", instruction: "Use a deep navy aurora interface with cyan and violet, floating glass panels, luminous gradients, rounded geometry and soft animated glows." },
  { name: "industrial-grid", instruction: "Use charcoal, lime and amber with sharp borders, technical labels, condensed headings, modular grids and dashboard-like structure." },
  { name: "monochrome-electric", instruction: "Use white and near-black with one electric-blue accent, oversized typography, kinetic lines, crisp spacing and restrained motion." },
  { name: "organic-premium", instruction: "Use cream, forest green and terracotta with tactile cards, botanical forms, soft curves, editorial typography and layered natural depth." },
  { name: "luxury-burgundy", instruction: "Use black, burgundy and muted gold with cinematic spacing, elegant serif type, spotlight gradients and refined luxury borders." },
  { name: "playful-modular", instruction: "Use cobalt, sunny yellow and pink with offset cards, sticker-like details, bold rounded typography and energetic interactions." },
  { name: "soft-professional", instruction: "Use slate, teal and lavender with balanced grids, humanist typography, subtle shadows and polished product-workspace motion." },
  { name: "neon-cyber", instruction: "Use black, electric magenta and cyan with holographic borders, perspective grids, scan-line accents and controlled cyber 3D motion." },
  { name: "royal-sapphire", instruction: "Use sapphire, indigo and champagne gold with polished panels, crest-like details, premium layered depth and VVIP typography." },
  { name: "sunset-future", instruction: "Use violet, coral, orange and midnight blue with fluid gradients, curved panels, floating 3D cards and luminous motion." },
  { name: "emerald-vip", instruction: "Use deep emerald, black, pearl and gold with architectural grids, premium cards, subtle reflections and executive motion." },
] as const

const RESPONSIVE_PROJECT_RULES = `
RESPONSIVE LAYOUT QUALITY — MANDATORY:
- Every page must work at 320px, 375px, 390px, 414px, 768px, 820px, 1024px, 1366px and wide desktop sizes.
- Use w-full, max-w-*, min-w-0, flex-wrap, responsive grids and responsive padding.
- Text, tables, cards, forms, images and controls must remain inside their parents at every target width.
- The document must not have horizontal page scrolling except inside intentional local containers.
- Preserve functionality while making each layout intentional on mobile, tablet and desktop.
`

const PREMIUM_PROJECT_RULES = `
PREMIUM / VVIP PROJECT QUALITY — MANDATORY FOR NEW PROJECTS:
- Produce a complete custom product, not a generic starter template or repeated demo.
- Use project-specific 3D depth, layered surfaces, hover tilt, floating cards, luminous shadows, parallax-like composition or embossed details where suitable.
- Add lightweight CSS-first animation: reveals, ambient gradients, shimmer, moving highlights, animated borders, floating decoration and refined button feedback.
- Do not default every project to purple/cyan or the same dark dashboard.
- Create a distinctive hero, navigation, section rhythm, card geometry, typography pairing, background treatment and CTA composition.
- Make important interactions functional in React. No dead links or decorative fake controls.
- Use only existing permitted dependencies and keep the result fast and responsive.
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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 48)
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
  return { seed, profile: DESIGN_PROFILES[hashText(seed) % DESIGN_PROFILES.length] }
}

function uniqueDesignRules(seed: string, profile: (typeof DESIGN_PROFILES)[number]) {
  return `
PROJECT DESIGN IDENTITY — MANDATORY FOR THIS PROJECT:
- UNIQUE_DESIGN_ID: ${seed}
- DESIGN_PROFILE: ${profile.name}
- ${profile.instruction}
- Build a project-specific visual system rather than a category starter template.
- Do not reuse another project's palette, hero, navigation, cards, typography, section order, wording, content, background, animation sequence or component geometry.
- Even two projects in the same business category must look clearly unrelated.
- Keep this identity consistent across every generated page and component.
${PREMIUM_PROJECT_RULES}
`
}

function safeExisting(value: unknown) {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.fileTree) || !raw.keyFiles || typeof raw.keyFiles !== "object") return undefined
  return {
    title: String(raw.title || "").slice(0, 200),
    description: String(raw.description || "").slice(0, 2_000),
    fileTree: raw.fileTree.slice(0, MAX_CONTEXT_FILES).map((path) => String(path).slice(0, 500)),
    keyFiles: Object.fromEntries(
      Object.entries(raw.keyFiles as Record<string, unknown>)
        .slice(0, 20)
        .map(([path, content]) => [String(path).slice(0, 500), String(content).slice(0, MAX_CONTEXT_FILE_LENGTH)])
    ),
  }
}

function addResponsiveSafety(files: Record<string, string>) {
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

function localResponse(userRequest: string, projectId: string | null, reason: string, identityPrompt: string, preserveExisting: boolean) {
  const local = createPremiumFallbackProject(preserveExisting ? userRequest : `${userRequest}\n\n${identityPrompt}`)
  const now = new Date().toISOString()
  const id = projectId ?? local.id
  return NextResponse.json({
    success: true,
    response: preserveExisting
      ? `${local.title} updated with working files and responsive layout.`
      : `${local.title} created with a genuinely separate premium design, 3D depth, animation and a unique layout system.`,
    model: "786-chat-premium-fallback",
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
      return NextResponse.json({ success: false, error: "Message or attachment is required." }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ success: false, error: "Message is too large." }, { status: 413 })
    }

    const requestedMode = String(body.mode || "auto") as CodegenMode
    const mode: CodegenMode = ALLOWED_MODES.has(requestedMode) ? requestedMode : "auto"
    const projectId = typeof body.projectId === "string" && body.projectId.trim()
      ? body.projectId.trim().slice(0, 200)
      : null
    const existing = safeExisting(body.existing)
    const identity = designIdentity(projectId)
    const userRequest = message || "Inspect the attached file and update the existing project to match it."
    const identityPrompt = existing
      ? "Preserve this existing project's established visual identity, layout, palette, motion and component geometry unless the user explicitly requests a full redesign."
      : uniqueDesignRules(identity.seed, identity.profile)
    const prompt = `${userRequest}\n\n${identityPrompt}\n\n${OPTIONAL_PROJECT_FEATURE_RULES}\n\n${RESPONSIVE_PROJECT_RULES}`

    try {
      const codegen = await Promise.race([
        generateProjectCode({ prompt, mode, existing, attachments }),
        timeout<Awaited<ReturnType<typeof generateProjectCode>>>(52_000),
      ])
      const now = new Date().toISOString()
      const id = projectId ?? `${slugify(codegen.title) || "project"}-${Date.now()}`
      return NextResponse.json({
        success: true,
        response: codegen.reply,
        model: codegen.model,
        reason: codegen.reason,
        designIdentity: existing ? undefined : identity.profile.name,
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
      console.error("[786.Chat] AI codegen failed; returning varied premium fallback project", generationError)
      return localResponse(userRequest, projectId, reason, identityPrompt, Boolean(existing))
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "786.Chat request failed."
    const isValidationError = /attachment|supported|maximum|too large|invalid/i.test(message)
    console.error("[786.Chat] request failed", error)
    return NextResponse.json(
      { success: false, error: isValidationError ? message : "786.Chat request failed. Please check the request and try again." },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
