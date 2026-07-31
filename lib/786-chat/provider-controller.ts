import { NextResponse } from "next/server"
import {
  generateProjectCode,
  type CodegenAttachment,
  type CodegenMode,
} from "@/lib/786-admin/codegen"

export const runtime = "nodejs"
export const maxDuration = 180
const GEMINI_ATTEMPT_TIMEOUT_MS = 25_000
const DEEPSEEK_ATTEMPT_TIMEOUT_MS = 150_000
const DEEPSEEK_FLASH_ATTEMPT_TIMEOUT_MS = 120_000

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

function attemptTimeout(mode: CodegenMode) {
  if (mode === "deepseek-flash") return DEEPSEEK_FLASH_ATTEMPT_TIMEOUT_MS
  return providerForMode(mode) === "deepseek"
    ? DEEPSEEK_ATTEMPT_TIMEOUT_MS
    : GEMINI_ATTEMPT_TIMEOUT_MS
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

async function runAttempt(
  request: Request,
  payload: GeneratorPayload,
  mode: CodegenMode,
  useCompactProfile: boolean,
  coordinatorSignal: AbortSignal,
): Promise<GeneratorResult> {
  const message = String(payload.message || "").trim()
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
  const timeoutMs = attemptTimeout(mode)
  const controller = new AbortController()
  const abortFromClient = () => controller.abort(request.signal.reason)
  const abortFromCoordinator = () => controller.abort(coordinatorSignal.reason)
  request.signal.addEventListener("abort", abortFromClient, { once: true })
  coordinatorSignal.addEventListener("abort", abortFromCoordinator, { once: true })
  const generated = await Promise.race([
    generateProjectCode({
      prompt: `${message}${compactRules}`,
      mode,
      abortSignal: controller.signal,
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
    coordinatorSignal.removeEventListener("abort", abortFromCoordinator)
  })
  const now = new Date().toISOString()
  return {
    success: true,
    response: generated.reply,
    model: generated.model,
    reason: generated.reason,
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
  const primaryMode = requestedMode === "auto" && compactEligible && configured("DEEPSEEK_API_KEY")
    ? "deepseek-flash"
    : resolvedPrimaryMode(requestedMode, hasAttachments)
  const secondaryMode = alternateMode(primaryMode, hasAttachments)
  const rescueModes: CodegenMode[] = hasAttachments ? [] : ["deepseek-flash", "gemini-flash"]
  const candidateModes = Array.from(new Set<CodegenMode>([primaryMode, secondaryMode, ...rescueModes]))
  const configuredModes = candidateModes.filter(modeConfigured)
  const attempts: ProviderAttempt[] = candidateModes
    .filter((mode) => !modeConfigured(mode))
    .map((mode) => ({ mode, reason: missingConfigurationReason(mode), fallback: false, configured: false, status: "missing" }))

  // Run one bounded attempt when no key is configured so the response contains a
  // truthful provider error. A static project is never substituted.
  const modesToRun = configuredModes.length > 0 ? configuredModes : [primaryMode]
  const attemptsByMode = new Map<CodegenMode, Promise<{ mode: CodegenMode; result?: GeneratorResult; error?: unknown; compact: boolean }>>()
  const coordinator = new AbortController()

  for (const mode of modesToRun) {
    const compact = compactEligible && providerForMode(mode) === "deepseek"
    attemptsByMode.set(
      mode,
      runAttempt(request, payload, mode, compact, coordinator.signal)
        .then((result) => ({ mode, result, compact }))
        .catch((error) => ({ mode, error, compact })),
    )
  }

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
      coordinator.abort(new Error(`Provider winner selected: ${settled.mode}`))
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

  }
  coordinator.abort(new Error("All provider attempts completed."))

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
      providerFailoverUsed: true,
      projectPreserved: true,
    }, { status: 503 })
  }

  return NextResponse.json({
    success: false,
    error: compactFailure(attempts, false),
    warning: "ALL_AI_PROVIDERS_FAILED",
    providerAttempts: attempts,
    providerStatus: providerSummary(attempts),
  }, { status: 503 })
}
