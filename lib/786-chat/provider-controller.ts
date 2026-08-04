import { NextResponse } from "next/server"
import {
  generateProjectCode,
  type CodegenAttachment,
  type CodegenMode,
} from "@/lib/786-admin/codegen"

export const runtime = "nodejs"
export const maxDuration = 180
const DEEPSEEK_ATTEMPT_TIMEOUT_MS = 45_000
const GEMINI_ATTEMPT_TIMEOUT_MS = 75_000

type GeneratorPayload = Record<string, unknown> & { mode?: CodegenMode; attachments?: unknown[]; existing?: unknown }
type GeneratorResult = Record<string, unknown> & { success?: boolean; response?: string; model?: string; reason?: string; fellBackToLocal?: boolean; generationProfile?: string; usage?: unknown }
type ProviderAttempt = { mode: CodegenMode; model?: string; reason?: string; fallback: boolean; configured: boolean; status: "ok" | "missing" | "quota_exhausted" | "timed_out" | "failed"; profile?: string; durationMs?: number; usage?: unknown }

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

function gatewayConfigured(): boolean {
  return configured("AI_GATEWAY_API_KEY") ||
    configured("VERCEL_OIDC_TOKEN") ||
    process.env.VERCEL === "1"
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

function attemptTimeout(mode: CodegenMode) {
  return providerForMode(mode) === "deepseek"
    ? DEEPSEEK_ATTEMPT_TIMEOUT_MS
    : GEMINI_ATTEMPT_TIMEOUT_MS
}

function missingConfigurationReason(mode: CodegenMode): string {
  return `${providerForMode(mode) === "deepseek" ? "DeepSeek" : "Gemini"} cannot start because neither its direct API key nor Vercel AI Gateway authentication is available.`
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

function isSimpleWebsiteRequest(payload: GeneratorPayload, hasAttachments: boolean): boolean {
  if (hasAttachments || payload.existing) return false
  const message = String(payload._originalPrompt || payload.message || "").trim().toLowerCase()
  if (!message || message.length > 3_000) return false
  const complexTerms = [
    "database", "backend", "api", "saas", "erp", "crm", "inventory", "manufacturing", "factory",
    "school management", "iot", "mqtt", "bluetooth", "wifi", "device", "multi-company", "multi tenant",
    "authentication", "roles", "permissions", "subscription", "mobile app", "android", "iphone", "expo",
    "payment integration", "stripe", "automation", "analytics dashboard", "customer portal", "admin dashboard",
  ]
  return !complexTerms.some((term) => message.includes(term))
}

async function runAttempt(
  request: Request,
  payload: GeneratorPayload,
  mode: CodegenMode,
  useCompactProfile: boolean,
  timeoutMs: number,
): Promise<GeneratorResult> {
  const message = String(payload.message || "").trim()
  const originalMessage = String(payload._originalPrompt || message).trim()
  const compactRules = useCompactProfile
    ? [
        "",
        "COMPACT WEBSITE PROFILE:",
        "- Generate a complete Next.js App Router project.",
        "- Include a real page file for every requested route.",
        "- Honour the requested brand, industry, colours, content and interactions.",
        "- Do not use generic 786 artwork, placeholder copy, or a repeated template.",
      ].join("\n")
    : ""
  const existing = payload.existing && typeof payload.existing === "object"
    ? payload.existing as {
        title: string
        description: string
        fileTree: string[]
        keyFiles: Record<string, string>
      }
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
      prompt: `${useCompactProfile ? originalMessage : message}${compactRules}`,
      mode,
      abortSignal: controller.signal,
      userId: String(payload._actorUserId || "anonymous-builder"),
      userPlan: String(payload._actorPlan || "starter"),
      generationId: String(payload._generationId || ""),
      maxOutputTokens: useCompactProfile ? 10_000 : undefined,
      attachments,
      existing,
    }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => {
          controller.abort(new Error(`${mode} timed out after ${timeoutMs}ms`))
          reject(new Error(`${mode} timed out after ${timeoutMs}ms`))
        },
        timeoutMs,
      )
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
    generationProfile: useCompactProfile ? "compact-website" : "full-platform",
    project: {
      id: typeof payload.projectId === "string" && payload.projectId.trim()
        ? payload.projectId.trim()
        : crypto.randomUUID(),
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
  for (const attempt of attempts) {
    summary[providerForMode(attempt.mode)] = attempt.status
  }
  return summary
}

function compactFailure(attempts: ProviderAttempt[], preserved: boolean) {
  const statuses = providerSummary(attempts)
  const parts = [
    statuses.gemini === "quota_exhausted" ? "Gemini quota is exhausted" : statuses.gemini ? `Gemini ${statuses.gemini.replaceAll("_", " ")}` : "",
    statuses.deepseek === "timed_out" ? "DeepSeek timed out" : statuses.deepseek ? `DeepSeek ${statuses.deepseek.replaceAll("_", " ")}` : "",
  ].filter(Boolean)
  const summary = parts.length > 0 ? parts.join("; ") : "The configured AI providers are unavailable"
  return preserved
    ? `${summary}. Your existing project was kept unchanged. Retry when a provider is available.`
    : `${summary}. No project was created. Retry when a provider is available.`
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as GeneratorPayload
  const requested = String(payload.mode || "auto") as CodegenMode
  const requestedMode: CodegenMode = ["auto", "deepseek-flash", "deepseek-pro", "gemini-flash", "gemini-pro"].includes(requested) ? requested : "auto"
  const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0
  const isExistingEdit = Boolean(payload.existing && typeof payload.existing === "object")
  const compactEligible = isSimpleWebsiteRequest(payload, hasAttachments)

  const primaryMode: CodegenMode = requestedMode === "gemini-pro"
    ? "gemini-pro"
    : requestedMode === "gemini-flash"
      ? "gemini-flash"
      : requestedMode === "deepseek-pro"
        ? "deepseek-pro"
        : "deepseek-flash"
  const fallbackMode: CodegenMode = providerForMode(primaryMode) === "deepseek"
    ? "gemini-flash"
    : "deepseek-flash"
  const candidateModes: CodegenMode[] = [primaryMode, fallbackMode]
  const configuredModes = candidateModes.filter(modeConfigured)
  const attempts: ProviderAttempt[] = candidateModes
    .filter((mode) => !modeConfigured(mode))
    .map((mode, position) => ({
      mode,
      reason: missingConfigurationReason(mode),
      fallback: position > 0,
      configured: false,
      status: "missing",
    }))

  for (const [position, mode] of configuredModes.entries()) {
    const compact = compactEligible
    const startedAt = Date.now()
    let result: GeneratorResult
    try {
      result = await runAttempt(request, payload, mode, compact, attemptTimeout(mode))
    } catch (error) {
      const reason = safeReason(error instanceof Error ? error.message : error)
      attempts.push({
        mode,
        reason,
        fallback: position > 0,
        configured: true,
        status: attemptStatus(reason),
        profile: compact ? "compact-website" : "full-platform",
        durationMs: Date.now() - startedAt,
      })
      continue
    }

    const reason = safeReason(result.reason || result.response || "Provider returned no diagnostic.")
    attempts.push({
      mode,
      model: String(result.model || ""),
      reason,
      fallback: position > 0,
      configured: true,
      status: result.success && !result.fellBackToLocal ? "ok" : attemptStatus(reason),
      profile: String(result.generationProfile || (compact ? "compact-website" : "full-platform")),
      durationMs: Date.now() - startedAt,
      usage: result.usage,
    })

    if (result.success && !result.fellBackToLocal) {
      return NextResponse.json({
        ...result,
        response: mode === primaryMode
          ? result.response
          : `Primary AI provider was unavailable. 786.Chat automatically completed this project with ${result.model || mode}.\n\n${result.response || ""}`.trim(),
        providerAttempts: attempts,
        providerStatus: providerSummary(attempts),
        providerFailoverUsed: mode !== primaryMode,
      })
    }
  }

  const diagnostic = attempts
    .map((attempt) => `${attempt.mode} (${attempt.status}): ${safeReason(attempt.reason || attempt.model || "failed")}`)
    .join(" | ")
  console.error(`[786.Chat provider failure] ${diagnostic}`)

  if (isExistingEdit) {
    return NextResponse.json({
      success: false,
      error: compactFailure(attempts, true),
      warning: "EDIT_NOT_APPLIED_PROJECT_PRESERVED",
      providerAttempts: attempts,
      providerStatus: providerSummary(attempts),
      providerFailoverUsed: attempts.length > 1,
      projectPreserved: true,
    }, { status: 503 })
  }

  return NextResponse.json({
    success: false,
    error: compactFailure(attempts, false),
    warning: "ALL_AI_PROVIDERS_FAILED",
    providerAttempts: attempts,
    providerStatus: providerSummary(attempts),
    providerFailoverUsed: attempts.length > 1,
  }, { status: 503 })
}
