import { NextResponse } from "next/server"
import {
  generateProjectCode,
  type CodegenAttachment,
  type CodegenMode,
} from "@/lib/786-admin/codegen"

export const runtime = "nodejs"
export const maxDuration = 300

// Production is currently enforcing an approximately 180s runtime ceiling.
// Keep the two sequential Flash attempts safely below it while giving the
// primary provider enough time to finish a large structured project response.
const COMPLEX_DEEPSEEK_TIMEOUT_MS = 112_000
const COMPLEX_GEMINI_FALLBACK_TIMEOUT_MS = 58_000
const SIMPLE_DEEPSEEK_TIMEOUT_MS = 110_000
const SIMPLE_GEMINI_TIMEOUT_MS = 60_000
const LARGE_EDIT_GEMINI_TIMEOUT_MS = 105_000
const LARGE_EDIT_DEEPSEEK_FALLBACK_TIMEOUT_MS = 65_000

type GenerationProfile = "website" | "full-stack"
type GeneratorPayload = Record<string, unknown> & {
  mode?: CodegenMode
  attachments?: unknown[]
  existing?: unknown
}
type GeneratorResult = Record<string, unknown> & {
  success?: boolean
  response?: string
  model?: string
  reason?: string
  fellBackToLocal?: boolean
  generationProfile?: string
  usage?: unknown
}
type ProviderAttempt = {
  mode: CodegenMode
  model?: string
  reason?: string
  fallback: boolean
  configured: boolean
  status: "ok" | "missing" | "quota_exhausted" | "timed_out" | "failed"
  profile?: string
  durationMs?: number
  usage?: unknown
}

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

function gatewayConfigured(): boolean {
  return configured("AI_GATEWAY_API_KEY") || configured("VERCEL_OIDC_TOKEN") || process.env.VERCEL === "1"
}

function providerForMode(mode: CodegenMode): "deepseek" | "gemini" {
  return mode === "gemini-flash" || mode === "gemini-pro" ? "gemini" : "deepseek"
}

function modeConfigured(mode: CodegenMode): boolean {
  if (providerForMode(mode) === "deepseek") {
    return configured("DEEPSEEK_API_KEY") || gatewayConfigured()
  }
  return configured("GOOGLE_GENERATIVE_AI_API_KEY") || configured("GEMINI_API_KEY") || gatewayConfigured()
}

function safeReason(value: unknown): string {
  const text = String(value || "Provider failed.")
    .replace(/https?:\/\/\S+/gi, "provider documentation")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
  return text.slice(0, 500) || "Provider failed."
}

function attemptStatus(reason: unknown, success = false): ProviderAttempt["status"] {
  if (success) return "ok"
  const text = String(reason || "").toLowerCase()
  if (/quota|rate.?limit|resource exhausted|429|exceeded your current quota/.test(text)) return "quota_exhausted"
  if (/timed out|timeout|did not finish/.test(text)) return "timed_out"
  return "failed"
}

function requestText(payload: GeneratorPayload): string {
  return String(payload._originalPrompt || payload.message || "").trim().toLowerCase()
}

function isExplicitFrontendOnly(message: string): boolean {
  return /front[ -]?end\s*-?\s*only|frontend-only|frontend only/.test(message) ||
    /do not create[^\n]*(database|backend|api)|no\s+(database|backend|api)|without\s+(a\s+)?(database|backend|api)/.test(message)
}

function asksForBackendCapability(message: string): boolean {
  return [
    "database", "backend", "api route", "api endpoint", "neon", "postgres", "authentication",
    "roles", "permissions", "subscription", "billing", "payment", "stripe", "checkout",
    "online ordering", "order tracking", "customer dashboard", "admin dashboard", "driver app",
    "kitchen dashboard", "invoice", "quotation", "crm", "erp", "inventory", "manufacturing",
    "school management", "hospital management", "pos system", "warehouse", "saas",
  ].some((term) => message.includes(term))
}

function frontendEditWeight(message: string): number {
  const routeWords = [
    "page", "pages", "menu", "gallery", "about", "contact", "services", "destinations", "packages",
    "testimonials", "faq", "newsletter", "footer", "navigation", "team", "timeline", "lightbox",
  ]
  const listItems = (message.match(/^\s*-\s*[^\n]+$/gim) || []).length
  return listItems + routeWords.filter((term) => message.includes(term)).length + Math.floor(message.length / 700)
}

function isLargeFrontendEdit(payload: GeneratorPayload, isComplex: boolean): boolean {
  if (!payload.existing || isComplex) return false
  return frontendEditWeight(requestText(payload)) >= 12
}

function isComplexApplicationRequest(payload: GeneratorPayload, hasAttachments: boolean): boolean {
  const message = requestText(payload)
  if (!message) return Boolean(hasAttachments)
  if (isExplicitFrontendOnly(message)) return false
  if (payload.existing) return asksForBackendCapability(message)
  if (hasAttachments) return true
  const terms = [
    "database", "backend", "api", "saas", "erp", "crm", "inventory", "manufacturing",
    "school management", "hospital management", "pos system", "warehouse", "authentication",
    "roles", "permissions", "subscription", "billing", "payment", "stripe", "checkout",
    "online ordering", "order tracking", "customer dashboard", "admin dashboard", "driver app",
    "kitchen dashboard", "portal", "invoice", "quotation", "booking system", "table booking",
  ]
  return message.length > 2_800 || terms.some((term) => message.includes(term))
}

function profileRules(profile: GenerationProfile, isExistingEdit: boolean, isLargeEdit: boolean): string {
  if (profile === "full-stack") {
    return [
      "",
      isExistingEdit ? "Extend the existing application with the requested full-stack capabilities." : "Generate the complete requested application.",
      "FULL-STACK COMPACTNESS RULES — MANDATORY:",
      "- Keep the structured response compact while preserving every requested route and backend capability.",
      "- Use one shared frontend component for navigation, footer, cards and page sections.",
      "- Interactive routes such as booking, contact, login, checkout and requested forms must contain their functional controls and handlers in the route file when validation checks that route directly.",
      "- Do not duplicate JSX, navigation arrays, footer markup, product data or CSS between routes.",
      "- Keep app/globals.css concise and avoid decorative repetition, embedded SVG art, data URLs or base64 assets.",
      "- Centralize reusable server concerns such as query helpers, Zod schemas and response helpers in lib/server.",
      "- API collection/item files may be thin adapters to shared validated handlers when required HTTP methods and security are preserved.",
      "- Keep backend docs, manifest, schema and migration concise but complete. Never omit a mandatory file.",
      isExistingEdit ? "- For an edit, return ONLY new or modified files." : "- Return complete runnable files only.",
      "- Where external credentials are unavailable, document environment variable names only; never create mock secrets.",
      "Return valid structured project output with no markdown outside the required object.",
    ].join("\n")
  }
  if (isExistingEdit) {
    return [
      "",
      "Apply this request as a compact edit to the EXISTING Next.js website.",
      "EDIT RELIABILITY RULES:",
      "- Return ONLY files that are new or actually modified; preserve all unrelated files and functionality.",
      "- When adding routes, create thin app/<route>/page.tsx wrappers where possible, but keep required functional forms in the route file.",
      "- Prefer modifying shared components/data arrays instead of duplicating JSX or CSS.",
      isLargeEdit ? "- This is a multi-page frontend edit. Keep route wrappers small and centralize shared sections/data." : "- Keep the response compact and targeted.",
      "- Do NOT return package.json, tsconfig.json, Next.js config, layout or global CSS unless genuinely required.",
      "- Every returned file must be complete and syntactically valid.",
      "Return valid structured project output with no markdown outside the required object.",
    ].join("\n")
  }
  return [
    "",
    "Generate a compact complete runnable Next.js App Router website.",
    "HARD COMPACTNESS RULES:",
    "- Use one shared components/SitePage.tsx component for shared visual sections and shared data.",
    "- Ordinary informational route files should be thin wrappers.",
    "- Functional routes must contain the required controls and handlers in the route file so validation can verify them.",
    "- Put navigation, footer, cards and shared arrays only once; route-specific functional forms are allowed outside SitePage.",
    "- Keep app/globals.css below 150 lines and do not include data URLs, base64 images, inline SVG artwork or repeated CSS.",
    "- Use remote image URLs only; never embed image bytes.",
    "- Include only configuration files needed for a runnable project.",
    "- Create every requested route with working navigation and responsive design.",
    "Return valid structured project output with no markdown outside the required object.",
  ].join("\n")
}

async function runAttempt(
  request: Request,
  payload: GeneratorPayload,
  mode: CodegenMode,
  profile: GenerationProfile,
  timeoutMs: number,
  largeFrontendEdit: boolean,
): Promise<GeneratorResult> {
  const message = String(payload.message || "").trim()
  const originalMessage = String(payload._originalPrompt || message).trim()
  const existing = payload.existing && typeof payload.existing === "object"
    ? payload.existing as { title: string; description: string; fileTree: string[]; keyFiles: Record<string, string> }
    : undefined
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments.filter((attachment): attachment is CodegenAttachment => {
        if (!attachment || typeof attachment !== "object") return false
        const value = attachment as Record<string, unknown>
        return typeof value.url === "string" && typeof value.mediaType === "string"
      })
    : []
  let timer: ReturnType<typeof setTimeout> | undefined
  const controller = new AbortController()
  const abortFromClient = () => controller.abort(request.signal.reason)
  request.signal.addEventListener("abort", abortFromClient, { once: true })
  const provider = providerForMode(mode)
  // Long owner generations need a little more response headroom. The output
  // budget is still bounded per request; "unlimited owner" means unlimited
  // plan/rate/prompt limits, not an unbounded provider response.
  const maxOutputTokens = profile === "full-stack"
    ? (provider === "gemini" ? 16_000 : 20_000)
    : existing
      ? (provider === "gemini" ? 14_000 : 8_000)
      : (provider === "gemini" ? 14_000 : 8_192)
  const generated = await Promise.race([
    generateProjectCode({
      prompt: `${originalMessage || message}${profileRules(profile, Boolean(existing), largeFrontendEdit)}`,
      mode,
      abortSignal: controller.signal,
      userId: String(payload._actorUserId || "anonymous-builder"),
      userPlan: String(payload._actorPlan || "starter"),
      generationId: String(payload._generationId || ""),
      maxOutputTokens,
      attachments,
      existing,
    }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort(new Error(`${mode} timed out after ${timeoutMs}ms`))
        reject(new Error(`${mode} timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer)
    request.signal.removeEventListener("abort", abortFromClient)
  })
  const now = new Date().toISOString()
  return {
    success: true,
    response: generated.reply,
    model: generated.model,
    reason: generated.reason,
    usage: generated.usage,
    fellBackToLocal: false,
    generationProfile: profile,
    project: {
      id: typeof payload.projectId === "string" && payload.projectId.trim() ? payload.projectId.trim() : crypto.randomUUID(),
      title: generated.title,
      description: generated.description,
      prompt: message,
      createdAt: now,
      updatedAt: now,
      files: generated.files,
    },
  }
}

function providerSummary(attempts: ProviderAttempt[]) {
  const summary: Record<string, string> = {}
  for (const attempt of attempts) summary[providerForMode(attempt.mode)] = attempt.status
  return summary
}

function compactFailure(attempts: ProviderAttempt[], preserved: boolean) {
  const statuses = providerSummary(attempts)
  const parts = [
    statuses.deepseek === "timed_out" ? "DeepSeek timed out" : statuses.deepseek ? `DeepSeek ${statuses.deepseek.replaceAll("_", " ")}` : "",
    statuses.gemini === "quota_exhausted" ? "Gemini quota is exhausted" : statuses.gemini ? `Gemini ${statuses.gemini.replaceAll("_", " ")}` : "",
  ].filter(Boolean)
  const summary = parts.length ? parts.join("; ") : "The configured AI providers are unavailable"
  return preserved ? `${summary}. Your existing project was kept unchanged.` : `${summary}. No project was created.`
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as GeneratorPayload
  const requested = String(payload.mode || "auto") as CodegenMode
  const requestedMode: CodegenMode = ["auto", "deepseek-flash", "deepseek-pro", "gemini-flash", "gemini-pro"].includes(requested) ? requested : "auto"
  const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0
  const isExistingEdit = Boolean(payload.existing && typeof payload.existing === "object")
  const isComplex = isComplexApplicationRequest(payload, hasAttachments)
  const largeFrontendEdit = isLargeFrontendEdit(payload, isComplex)
  const profile: GenerationProfile = isComplex ? "full-stack" : "website"
  let candidateModes: CodegenMode[]
  if (requestedMode !== "auto") {
    const fallback: CodegenMode = providerForMode(requestedMode) === "deepseek" ? "gemini-flash" : "deepseek-flash"
    candidateModes = [requestedMode, fallback]
  } else if (isComplex) {
    candidateModes = ["deepseek-flash", "gemini-flash"]
  } else if (largeFrontendEdit) {
    candidateModes = ["gemini-flash", "deepseek-flash"]
  } else {
    candidateModes = ["deepseek-flash", "gemini-flash"]
  }
  const configuredModes = candidateModes.filter(modeConfigured)
  const attempts: ProviderAttempt[] = candidateModes
    .filter((mode) => !modeConfigured(mode))
    .map((mode, index) => ({ mode, reason: "Provider configuration is missing.", fallback: index > 0, configured: false, status: "missing", profile }))

  for (const [position, mode] of configuredModes.entries()) {
    const provider = providerForMode(mode)
    const timeoutMs = isComplex
      ? (provider === "deepseek" ? COMPLEX_DEEPSEEK_TIMEOUT_MS : COMPLEX_GEMINI_FALLBACK_TIMEOUT_MS)
      : largeFrontendEdit
        ? (provider === "gemini" ? LARGE_EDIT_GEMINI_TIMEOUT_MS : LARGE_EDIT_DEEPSEEK_FALLBACK_TIMEOUT_MS)
        : (provider === "deepseek" ? SIMPLE_DEEPSEEK_TIMEOUT_MS : SIMPLE_GEMINI_TIMEOUT_MS)
    const startedAt = Date.now()
    try {
      const result = await runAttempt(request, payload, mode, profile, timeoutMs, largeFrontendEdit)
      attempts.push({ mode, model: String(result.model || ""), reason: safeReason(result.reason || result.response || "Provider completed."), fallback: position > 0, configured: true, status: "ok", profile, durationMs: Date.now() - startedAt, usage: result.usage })
      return NextResponse.json({
        ...result,
        response: position === 0 ? result.response : `Primary provider did not complete. 786.Chat completed this project with ${result.model || mode}.\n\n${result.response || ""}`.trim(),
        providerAttempts: attempts,
        providerStatus: providerSummary(attempts),
        providerFailoverUsed: position > 0,
        requestComplexity: isComplex ? "complex" : largeFrontendEdit ? "large-frontend-edit" : "simple",
      })
    } catch (error) {
      const reason = safeReason(error instanceof Error ? error.message : error)
      attempts.push({ mode, reason, fallback: position > 0, configured: true, status: attemptStatus(reason), profile, durationMs: Date.now() - startedAt })
    }
  }
  const diagnostic = attempts.map((attempt) => `${attempt.mode} (${attempt.status}): ${safeReason(attempt.reason)}`).join(" | ")
  console.error(`[786.Chat provider failure] ${diagnostic}`)
  return NextResponse.json({
    success: false,
    error: compactFailure(attempts, isExistingEdit),
    warning: isExistingEdit ? "EDIT_NOT_APPLIED_PROJECT_PRESERVED" : "ALL_AI_PROVIDERS_FAILED",
    providerAttempts: attempts,
    providerStatus: providerSummary(attempts),
    providerFailoverUsed: attempts.some((attempt) => attempt.fallback),
    projectPreserved: isExistingEdit,
    requestComplexity: isComplex ? "complex" : largeFrontendEdit ? "large-frontend-edit" : "simple",
  }, { status: 503 })
}
