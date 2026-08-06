import { NextResponse } from "next/server"
import {
  generateProjectCode,
  type CodegenAttachment,
  type CodegenMode,
} from "@/lib/786-admin/codegen"

export const runtime = "nodejs"
export const maxDuration = 180

const SIMPLE_DEEPSEEK_TIMEOUT_MS = 115_000
const SIMPLE_GEMINI_TIMEOUT_MS = 50_000
const COMPLEX_GEMINI_TIMEOUT_MS = 95_000
const COMPLEX_DEEPSEEK_FALLBACK_TIMEOUT_MS = 75_000

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
  const saysFrontendOnly = /front[ -]?end\s*-?\s*only|frontend-only|frontend only/.test(message)
  const forbidsBackend = /do not create[^\n]*(database|backend|api)|no\s+(database|backend|api)|without\s+(a\s+)?(database|backend|api)/.test(message)
  return saysFrontendOnly || forbidsBackend
}

function isComplexApplicationRequest(payload: GeneratorPayload, hasAttachments: boolean): boolean {
  if (hasAttachments || payload.existing) return true
  const message = requestText(payload)
  if (!message) return false
  if (isExplicitFrontendOnly(message)) return false

  const terms = [
    "database", "backend", "api", "saas", "erp", "crm", "inventory", "manufacturing",
    "school management", "hospital management", "pos system", "warehouse", "authentication",
    "roles", "permissions", "subscription", "billing", "payment", "stripe", "checkout",
    "online ordering", "order tracking", "customer dashboard", "admin dashboard", "driver app",
    "kitchen dashboard", "portal", "invoice", "quotation", "booking system", "table booking",
  ]
  const routeCount = (message.match(/^\s*-\s*[a-z0-9][^\n]*$/gim) || []).length
  return message.length > 1_800 || routeCount >= 10 || terms.some((term) => message.includes(term))
}

function profileRules(profile: GenerationProfile): string {
  if (profile === "full-stack") {
    return [
      "",
      "Generate the complete requested application.",
      "Use shared layouts and reusable components so every requested page and workflow fits in one valid structured response.",
      "Return complete runnable files only. Do not omit routes, navigation, forms or core requested features.",
      "Where external credentials are unavailable, use safe test adapters and document the required environment variables.",
      "Return valid structured project output with no markdown outside the required object.",
    ].join("\n")
  }
  return [
    "",
    "Generate a compact complete runnable Next.js App Router website.",
    "Create every requested route with working navigation and responsive design.",
    "Use reusable shared components and keep the whole structured response below 6,500 output tokens.",
    "Return valid structured project output with no markdown outside the required object.",
  ].join("\n")
}

async function runAttempt(
  request: Request,
  payload: GeneratorPayload,
  mode: CodegenMode,
  profile: GenerationProfile,
  timeoutMs: number,
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

  const generated = await Promise.race([
    generateProjectCode({
      prompt: `${originalMessage || message}${profileRules(profile)}`,
      mode,
      abortSignal: controller.signal,
      userId: String(payload._actorUserId || "anonymous-builder"),
      userPlan: String(payload._actorPlan || "starter"),
      generationId: String(payload._generationId || ""),
      maxOutputTokens: profile === "full-stack" ? 12_000 : 6_500,
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
    statuses.deepseek === "timed_out" ? "DeepSeek reached the server time limit" : statuses.deepseek ? `DeepSeek ${statuses.deepseek.replaceAll("_", " ")}` : "",
    statuses.gemini === "quota_exhausted" ? "Gemini quota is exhausted" : statuses.gemini ? `Gemini ${statuses.gemini.replaceAll("_", " ")}` : "",
  ].filter(Boolean)
  const summary = parts.length ? parts.join("; ") : "The configured AI providers are unavailable"
  return preserved
    ? `${summary}. Your existing project was kept unchanged.`
    : `${summary}. No project was created.`
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as GeneratorPayload
  const requested = String(payload.mode || "auto") as CodegenMode
  const requestedMode: CodegenMode = ["auto", "deepseek-flash", "deepseek-pro", "gemini-flash", "gemini-pro"].includes(requested)
    ? requested
    : "auto"
  const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0
  const isExistingEdit = Boolean(payload.existing && typeof payload.existing === "object")
  const isComplex = isComplexApplicationRequest(payload, hasAttachments)
  const profile: GenerationProfile = isComplex ? "full-stack" : "website"

  let candidateModes: CodegenMode[]
  if (requestedMode !== "auto") {
    const fallback: CodegenMode = providerForMode(requestedMode) === "deepseek" ? "gemini-flash" : "deepseek-flash"
    candidateModes = [requestedMode, fallback]
  } else if (isComplex) {
    candidateModes = ["gemini-flash", "deepseek-flash"]
  } else {
    candidateModes = ["deepseek-flash", "gemini-flash"]
  }

  const configuredModes = candidateModes.filter(modeConfigured)
  const attempts: ProviderAttempt[] = candidateModes
    .filter((mode) => !modeConfigured(mode))
    .map((mode, index) => ({ mode, reason: "Provider configuration is missing.", fallback: index > 0, configured: false, status: "missing", profile }))

  for (const [position, mode] of configuredModes.entries()) {
    const timeoutMs = isComplex
      ? (providerForMode(mode) === "gemini" ? COMPLEX_GEMINI_TIMEOUT_MS : COMPLEX_DEEPSEEK_FALLBACK_TIMEOUT_MS)
      : (providerForMode(mode) === "deepseek" ? SIMPLE_DEEPSEEK_TIMEOUT_MS : SIMPLE_GEMINI_TIMEOUT_MS)
    const startedAt = Date.now()
    try {
      const result = await runAttempt(request, payload, mode, profile, timeoutMs)
      attempts.push({
        mode,
        model: String(result.model || ""),
        reason: safeReason(result.reason || result.response || "Provider completed."),
        fallback: position > 0,
        configured: true,
        status: "ok",
        profile,
        durationMs: Date.now() - startedAt,
        usage: result.usage,
      })
      return NextResponse.json({
        ...result,
        response: position === 0
          ? result.response
          : `Primary provider did not complete. 786.Chat completed this project with ${result.model || mode}.\n\n${result.response || ""}`.trim(),
        providerAttempts: attempts,
        providerStatus: providerSummary(attempts),
        providerFailoverUsed: position > 0,
        requestComplexity: isComplex ? "complex" : "simple",
      })
    } catch (error) {
      const reason = safeReason(error instanceof Error ? error.message : error)
      attempts.push({
        mode,
        reason,
        fallback: position > 0,
        configured: true,
        status: attemptStatus(reason),
        profile,
        durationMs: Date.now() - startedAt,
      })
    }
  }

  const diagnostic = attempts.map((attempt) => `${attempt.mode} (${attempt.status}): ${safeReason(attempt.reason)}`).join(" | ")
  console.error(`[786.Chat provider failure] ${diagnostic}`)

  const body = {
    success: false,
    error: compactFailure(attempts, isExistingEdit),
    warning: isExistingEdit ? "EDIT_NOT_APPLIED_PROJECT_PRESERVED" : "ALL_AI_PROVIDERS_FAILED",
    providerAttempts: attempts,
    providerStatus: providerSummary(attempts),
    providerFailoverUsed: attempts.some((attempt) => attempt.fallback),
    projectPreserved: isExistingEdit,
    requestComplexity: isComplex ? "complex" : "simple",
  }
  return NextResponse.json(body, { status: 503 })
}
