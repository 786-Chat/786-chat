import { NextResponse } from "next/server"
import { POST as runLegacyGenerator } from "@/app/api/786-admin/chat/route"
import { POST as runCompactGenerator } from "@/app/api/786-admin/chat-compact/route"
import type { CodegenMode } from "@/lib/786-admin/codegen"

export const runtime = "nodejs"
export const maxDuration = 60

type GeneratorPayload = Record<string, unknown> & { mode?: CodegenMode; attachments?: unknown[]; existing?: unknown }
type GeneratorResult = Record<string, unknown> & { success?: boolean; response?: string; model?: string; reason?: string; fellBackToLocal?: boolean; generationProfile?: string }
type ProviderAttempt = { mode: CodegenMode; model?: string; reason?: string; fallback: boolean; configured: boolean; status: "ok" | "missing" | "quota_exhausted" | "timed_out" | "failed"; profile?: string }

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

function providerForMode(mode: CodegenMode): "deepseek" | "gemini" {
  return mode === "gemini-flash" || mode === "gemini-pro" ? "gemini" : "deepseek"
}

function modeConfigured(mode: CodegenMode): boolean {
  if (providerForMode(mode) === "deepseek") return configured("DEEPSEEK_API_KEY")
  return configured("GOOGLE_GENERATIVE_AI_API_KEY") || configured("GEMINI_API_KEY")
}

function missingConfigurationReason(mode: CodegenMode): string {
  return providerForMode(mode) === "deepseek"
    ? "DeepSeek is not configured in Vercel (DEEPSEEK_API_KEY is missing)."
    : "Gemini is not configured in Vercel (GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY is missing)."
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

function alternateMode(mode: CodegenMode, hasAttachments: boolean): CodegenMode {
  if (hasAttachments) return mode === "gemini-flash" ? "gemini-pro" : "gemini-flash"
  if (mode === "gemini-flash" || mode === "gemini-pro") return "deepseek-pro"
  return "gemini-pro"
}

function resolvedPrimaryMode(requested: CodegenMode, hasAttachments: boolean): CodegenMode {
  if (requested !== "auto") return requested
  if (hasAttachments) return "gemini-pro"
  if (configured("DEEPSEEK_API_KEY")) return "deepseek-pro"
  if (configured("GOOGLE_GENERATIVE_AI_API_KEY") || configured("GEMINI_API_KEY")) return "gemini-pro"
  return "deepseek-pro"
}

function isSimpleWebsiteRequest(payload: GeneratorPayload, hasAttachments: boolean): boolean {
  if (hasAttachments || payload.existing) return false
  const message = String(payload.message || "").trim().toLowerCase()
  if (!message || message.length > 3_000) return false
  const complexTerms = [
    "database", "backend", "api", "saas", "erp", "crm", "inventory", "manufacturing", "factory",
    "school management", "iot", "mqtt", "bluetooth", "wifi", "device", "multi-company", "multi tenant",
    "authentication", "roles", "permissions", "subscription", "mobile app", "android", "iphone", "expo",
    "payment integration", "stripe", "automation", "analytics dashboard", "customer portal", "admin dashboard",
  ]
  return !complexTerms.some((term) => message.includes(term))
}

async function runAttempt(request: Request, payload: GeneratorPayload, mode: CodegenMode, useCompactProfile: boolean): Promise<GeneratorResult> {
  const headers = new Headers(request.headers)
  headers.set("content-type", "application/json")
  headers.set("x-786-resilient-attempt", mode)
  const attemptRequest = new Request(request.url, { method: "POST", headers, body: JSON.stringify({ ...payload, mode }) })
  const handler = useCompactProfile && providerForMode(mode) === "deepseek" ? runCompactGenerator : runLegacyGenerator
  const response = await handler(attemptRequest)
  return response.json().catch(() => ({ success: false, reason: `Invalid response from ${mode}.` })) as Promise<GeneratorResult>
}

function providerSummary(attempts: ProviderAttempt[]) {
  const summary: Record<string, string> = {}
  for (const attempt of attempts) {
    summary[providerForMode(attempt.mode)] = attempt.status
  }
  return summary
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as GeneratorPayload
  const requested = String(payload.mode || "auto") as CodegenMode
  const requestedMode: CodegenMode = ["auto", "deepseek-flash", "deepseek-pro", "gemini-flash", "gemini-pro"].includes(requested) ? requested : "auto"
  const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0
  const isExistingEdit = Boolean(payload.existing && typeof payload.existing === "object")
  const compactEligible = isSimpleWebsiteRequest(payload, hasAttachments)
  const primaryMode = resolvedPrimaryMode(requestedMode, hasAttachments)
  const secondaryMode = alternateMode(primaryMode, hasAttachments)
  const candidateModes = Array.from(new Set<CodegenMode>([primaryMode, secondaryMode]))
  const configuredModes = candidateModes.filter(modeConfigured)
  const attempts: ProviderAttempt[] = candidateModes
    .filter((mode) => !modeConfigured(mode))
    .map((mode) => ({ mode, reason: missingConfigurationReason(mode), fallback: false, configured: false, status: "missing" }))

  // When neither key exists, run one legacy attempt so new projects can still use
  // the explicitly-labelled local fallback. The diagnostic remains visible.
  const modesToRun = configuredModes.length > 0 ? configuredModes : [primaryMode]
  const attemptsByMode = new Map<CodegenMode, Promise<{ mode: CodegenMode; result?: GeneratorResult; error?: unknown; compact: boolean }>>()

  for (const mode of modesToRun) {
    const compact = compactEligible && providerForMode(mode) === "deepseek"
    attemptsByMode.set(
      mode,
      runAttempt(request, payload, mode, compact)
        .then((result) => ({ mode, result, compact }))
        .catch((error) => ({ mode, error, compact })),
    )
  }

  let localFallback: GeneratorResult | null = null

  while (attemptsByMode.size > 0) {
    const settled = await Promise.race(Array.from(attemptsByMode.values()))
    attemptsByMode.delete(settled.mode)

    if (settled.error) {
      const reason = safeReason(settled.error instanceof Error ? settled.error.message : settled.error)
      attempts.push({
        mode: settled.mode,
        reason,
        fallback: false,
        configured: modeConfigured(settled.mode),
        status: attemptStatus(reason),
        profile: settled.compact ? "compact-website" : "full-platform",
      })
      continue
    }

    const result = settled.result || {}
    const reason = safeReason(result.reason || result.response || "Provider returned no diagnostic.")
    attempts.push({
      mode: settled.mode,
      model: String(result.model || ""),
      reason,
      fallback: Boolean(result.fellBackToLocal),
      configured: modeConfigured(settled.mode),
      status: result.success && !result.fellBackToLocal ? "ok" : attemptStatus(reason),
      profile: String(result.generationProfile || (settled.compact ? "compact-website" : "full-platform")),
    })

    if (result.success && !result.fellBackToLocal) {
      return NextResponse.json({
        ...result,
        response: settled.mode === primaryMode
          ? result.response
          : `Primary AI provider was unavailable. 786.Chat automatically completed this project with ${result.model || settled.mode}.\n\n${result.response || ""}`.trim(),
        providerAttempts: attempts,
        providerStatus: providerSummary(attempts),
        providerFailoverUsed: settled.mode !== primaryMode,
      })
    }

    if (result.fellBackToLocal && !localFallback) localFallback = result
  }

  const diagnostic = attempts
    .map((attempt) => `${attempt.mode} (${attempt.status}): ${safeReason(attempt.reason || attempt.model || "failed")}`)
    .join(" | ")

  if (isExistingEdit) {
    return NextResponse.json({
      success: false,
      error: `Both AI providers were unavailable. Your existing project was kept unchanged. Provider diagnostic: ${diagnostic}`,
      warning: "EDIT_NOT_APPLIED_PROJECT_PRESERVED",
      providerAttempts: attempts,
      providerStatus: providerSummary(attempts),
      providerFailoverUsed: true,
      projectPreserved: true,
    }, { status: 503 })
  }

  if (localFallback) {
    return NextResponse.json({
      ...localFallback,
      response: `⚠ AI FALLBACK USED\n\nDeepSeek/Gemini could not complete this new-project request. The preview was created by the limited local fallback generator, not by the selected AI model.\n\nProvider diagnostic: ${diagnostic}`,
      reason: diagnostic,
      providerAttempts: attempts,
      providerStatus: providerSummary(attempts),
      providerFailoverUsed: true,
      fellBackToLocal: true,
      warning: "AI_FALLBACK_USED",
    })
  }

  return NextResponse.json({
    success: false,
    error: `All configured AI providers failed before a project could be generated. Provider diagnostic: ${diagnostic}`,
    warning: "ALL_AI_PROVIDERS_FAILED",
    providerAttempts: attempts,
    providerStatus: providerSummary(attempts),
  }, { status: 503 })
}
