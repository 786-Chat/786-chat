import { NextResponse } from "next/server"
import { generateProjectCode, type CodegenAttachment, type CodegenMode } from "@/lib/786-admin/codegen"

export const runtime = "nodejs"
export const maxDuration = 300

const COMPLEX_DEEPSEEK_TIMEOUT_MS = 235_000
const COMPLEX_GEMINI_FALLBACK_TIMEOUT_MS = 55_000
const SIMPLE_DEEPSEEK_TIMEOUT_MS = 150_000
const SIMPLE_GEMINI_TIMEOUT_MS = 75_000
const LARGE_EDIT_GEMINI_TIMEOUT_MS = 105_000
const LARGE_EDIT_DEEPSEEK_FALLBACK_TIMEOUT_MS = 120_000

type GenerationProfile = "website" | "full-stack"
type GeneratorPayload = Record<string, unknown> & { mode?: CodegenMode; attachments?: unknown[]; existing?: unknown }
type GeneratorResult = Record<string, unknown> & { success?: boolean; response?: string; model?: string; reason?: string; usage?: unknown }
type ProviderAttempt = { mode: CodegenMode; model?: string; reason?: string; fallback: boolean; configured: boolean; status: "ok" | "missing" | "quota_exhausted" | "timed_out" | "failed"; profile?: string; durationMs?: number; usage?: unknown }

function configured(name: string) { return Boolean(process.env[name]?.trim()) }
function gatewayConfigured() { return configured("AI_GATEWAY_API_KEY") || configured("VERCEL_OIDC_TOKEN") || process.env.VERCEL === "1" }
function providerForMode(mode: CodegenMode): "deepseek" | "gemini" { return mode === "gemini-flash" || mode === "gemini-pro" ? "gemini" : "deepseek" }
function modeConfigured(mode: CodegenMode) { return providerForMode(mode) === "deepseek" ? configured("DEEPSEEK_API_KEY") || gatewayConfigured() : configured("GOOGLE_GENERATIVE_AI_API_KEY") || configured("GEMINI_API_KEY") || gatewayConfigured() }
function safeReason(value: unknown) { return String(value || "Provider failed.").replace(/https?:\/\/\S+/gi, "provider documentation").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 500) || "Provider failed." }
function attemptStatus(reason: unknown, success = false): ProviderAttempt["status"] { if (success) return "ok"; const text = String(reason || "").toLowerCase(); if (/quota|rate.?limit|resource exhausted|429|exceeded your current quota/.test(text)) return "quota_exhausted"; if (/timed out|timeout|did not finish/.test(text)) return "timed_out"; return "failed" }
function requestText(payload: GeneratorPayload) { return String(payload._originalPrompt || payload.message || "").trim().toLowerCase() }
function isExplicitFrontendOnly(message: string) { return /front[ -]?end\s*-?\s*only|frontend-only|frontend only/.test(message) || /do not create[^\n]*(database|backend|api)|no\s+(database|backend|api)|without\s+(a\s+)?(database|backend|api)/.test(message) }
function asksForBackendCapability(message: string) { return ["database","backend","api route","api endpoint","neon","postgres","authentication","roles","permissions","subscription","billing","payment","stripe","checkout","online ordering","order tracking","customer dashboard","admin dashboard","driver app","kitchen dashboard","invoice","quotation","crm","erp","inventory","manufacturing","school management","hospital management","pos system","warehouse","saas"].some((term) => message.includes(term)) }
function frontendEditWeight(message: string) { const words = ["page","pages","menu","gallery","about","contact","services","destinations","packages","testimonials","faq","newsletter","footer","navigation","team","timeline","lightbox"]; return (message.match(/^\s*-\s*[^\n]+$/gim) || []).length + words.filter((term) => message.includes(term)).length + Math.floor(message.length / 700) }
function isLargeFrontendEdit(payload: GeneratorPayload, complex: boolean) { return Boolean(payload.existing) && !complex && frontendEditWeight(requestText(payload)) >= 12 }
function isComplexApplicationRequest(payload: GeneratorPayload, hasAttachments: boolean) { const message = requestText(payload); if (!message) return hasAttachments; if (isExplicitFrontendOnly(message)) return false; if (payload.existing) return asksForBackendCapability(message); if (hasAttachments) return true; const terms = ["database","backend","api","saas","erp","crm","inventory","manufacturing","school management","hospital management","pos system","warehouse","authentication","roles","permissions","subscription","billing","payment","stripe","checkout","online ordering","order tracking","customer dashboard","admin dashboard","driver app","kitchen dashboard","portal","invoice","quotation","booking system","table booking"]; return message.length > 2800 || terms.some((term) => message.includes(term)) }

function profileRules(profile: GenerationProfile, existing: boolean, largeEdit: boolean) {
  if (profile === "full-stack") return [
    "",
    existing ? "EDIT the existing application." : "NEW PROJECT: generate GreenDesk Operations as a complete runnable full-stack app.",
    "ULTRA-COMPACT FULL-STACK OUTPUT — MANDATORY:",
    "- Preserve EVERY explicit requested requirement, route, backend capability and security rule, but implement them with the fewest files and least code possible.",
    "- Target a compact response that fits the provider output budget. Do not write long prose, documentation, tests, README files, examples, duplicate components, duplicate data, decorative SVG, base64/data URLs or unnecessary config.",
    "- Use shared components for all dashboard/page UI, one shared navigation/footer, shared types/data helpers, and thin route page.tsx wrappers.",
    "- Keep API handlers compact and shared; use thin adapters only where separate resource routes are required.",
    "- Keep SQL schema/migration concise and complete. Keep server DB access in lib/server/db.ts and never expose secrets.",
    "- Use real validation/security patterns; never create fake secrets, fake authentication, fake dependencies or validation-only placeholder files.",
    "- Use realistic sample data only as a small fallback when database data is unavailable.",
    "- Do not include language fields unless useful. Keep title, description and reply extremely short.",
    "- Return only complete runnable project files required by the request. No markdown outside the JSON object."
  ].join("\n")
  if (existing) return ["", "Apply this request as a compact edit to the EXISTING Next.js website.", "- Return ONLY new or actually modified complete files.", "- Preserve unrelated files and functionality.", largeEdit ? "- This is a multi-page frontend edit: centralize shared sections/data and keep route wrappers tiny." : "- Keep the response compact and targeted.", "- Do not return package.json, tsconfig, Next config, layout or global CSS unless genuinely required.", "- Return valid structured project output with no markdown outside the JSON object."].join("\n")
  return ["", "Generate a compact complete runnable Next.js App Router website.", "- Use shared components and thin route wrappers.", "- Keep CSS and configuration concise; no data URLs, base64, inline SVG artwork or repeated CSS.", "- Create every requested route and keep navigation valid.", "- Return valid structured project output with no markdown outside the JSON object."].join("\n")
}

async function runAttempt(request: Request, payload: GeneratorPayload, mode: CodegenMode, profile: GenerationProfile, timeoutMs: number, largeFrontendEdit: boolean): Promise<GeneratorResult> {
  const message = String(payload.message || "").trim()
  const originalMessage = String(payload._originalPrompt || message).trim()
  const existing = payload.existing && typeof payload.existing === "object" ? payload.existing as { title: string; description: string; fileTree: string[]; keyFiles: Record<string, string> } : undefined
  const attachments = Array.isArray(payload.attachments) ? payload.attachments.filter((attachment): attachment is CodegenAttachment => { if (!attachment || typeof attachment !== "object") return false; const value = attachment as Record<string, unknown>; return typeof value.url === "string" && typeof value.mediaType === "string" }) : []
  let timer: ReturnType<typeof setTimeout> | undefined
  const controller = new AbortController()
  const abortFromClient = () => controller.abort(request.signal.reason)
  request.signal.addEventListener("abort", abortFromClient, { once: true })
  const provider = providerForMode(mode)
  const maxOutputTokens = profile === "full-stack" ? (provider === "gemini" ? 16_000 : 22_000) : existing ? (provider === "gemini" ? 14_000 : 12_000) : (provider === "gemini" ? 14_000 : 12_000)
  const generated = await Promise.race([
    generateProjectCode({ prompt: `${originalMessage || message}${profileRules(profile, Boolean(existing), largeFrontendEdit)}`, mode, abortSignal: controller.signal, userId: String(payload._actorUserId || "anonymous-builder"), userPlan: String(payload._actorPlan || "starter"), generationId: String(payload._generationId || ""), maxOutputTokens, attachments, existing }),
    new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(new Error(`${mode} timed out after ${timeoutMs}ms`)); reject(new Error(`${mode} timed out after ${timeoutMs}ms`)) }, timeoutMs) }),
  ]).finally(() => { if (timer) clearTimeout(timer); request.signal.removeEventListener("abort", abortFromClient) })
  const now = new Date().toISOString()
  return { success: true, response: generated.reply, model: generated.model, reason: generated.reason, usage: generated.usage, project: { id: typeof payload.projectId === "string" && payload.projectId.trim() ? payload.projectId.trim() : crypto.randomUUID(), title: generated.title, description: generated.description, prompt: message, createdAt: now, updatedAt: now, files: generated.files } }
}
function providerSummary(attempts: ProviderAttempt[]) { const summary: Record<string, string> = {}; for (const attempt of attempts) summary[providerForMode(attempt.mode)] = attempt.status; return summary }
function compactFailure(attempts: ProviderAttempt[], preserved: boolean) { const statuses = providerSummary(attempts); const parts = [statuses.deepseek === "timed_out" ? "DeepSeek timed out" : statuses.deepseek ? `DeepSeek ${statuses.deepseek.replaceAll("_", " ")}` : "", statuses.gemini === "quota_exhausted" ? "Gemini quota is exhausted" : statuses.gemini ? `Gemini ${statuses.gemini.replaceAll("_", " ")}` : ""].filter(Boolean); const summary = parts.length ? parts.join("; ") : "The configured AI providers are unavailable"; return preserved ? `${summary}. Your existing project was kept unchanged.` : `${summary}. No project was created.` }

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as GeneratorPayload
  const requested = String(payload.mode || "auto") as CodegenMode
  const requestedMode: CodegenMode = ["auto","deepseek-flash","deepseek-pro","gemini-flash","gemini-pro"].includes(requested) ? requested : "auto"
  const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0
  const isExistingEdit = Boolean(payload.existing && typeof payload.existing === "object")
  const isComplex = isComplexApplicationRequest(payload, hasAttachments)
  const largeFrontendEdit = isLargeFrontendEdit(payload, isComplex)
  const profile: GenerationProfile = isComplex ? "full-stack" : "website"
  let candidateModes: CodegenMode[]
  if (hasAttachments) {
    // Images must be sent to a vision-capable provider. Do not run DeepSeek first
    // and then silently force the request back to Gemini inside codegen; that made
    // the logs claim "DeepSeek failed" while Gemini was actually being called twice.
    candidateModes = ["gemini-flash"]
  } else if (requestedMode !== "auto") {
    candidateModes = [requestedMode, providerForMode(requestedMode) === "deepseek" ? "gemini-flash" : "deepseek-flash"]
  } else {
    candidateModes = isComplex ? ["deepseek-flash","gemini-flash"] : largeFrontendEdit ? ["gemini-flash","deepseek-flash"] : ["deepseek-flash","gemini-flash"]
  }
  const configuredModes = candidateModes.filter(modeConfigured)
  const attempts: ProviderAttempt[] = candidateModes.filter((mode) => !modeConfigured(mode)).map((mode, index) => ({ mode, reason: "Provider configuration is missing.", fallback: index > 0, configured: false, status: "missing", profile }))
  for (const [position, mode] of configuredModes.entries()) {
    const provider = providerForMode(mode)
    const timeoutMs = hasAttachments ? SIMPLE_GEMINI_TIMEOUT_MS : isComplex ? (provider === "deepseek" ? COMPLEX_DEEPSEEK_TIMEOUT_MS : COMPLEX_GEMINI_FALLBACK_TIMEOUT_MS) : largeFrontendEdit ? (provider === "gemini" ? LARGE_EDIT_GEMINI_TIMEOUT_MS : LARGE_EDIT_DEEPSEEK_FALLBACK_TIMEOUT_MS) : (provider === "deepseek" ? SIMPLE_DEEPSEEK_TIMEOUT_MS : SIMPLE_GEMINI_TIMEOUT_MS)
    const startedAt = Date.now()
    try {
      const result = await runAttempt(request, payload, mode, profile, timeoutMs, largeFrontendEdit)
      attempts.push({ mode, model: String(result.model || ""), reason: safeReason(result.reason || result.response || "Provider completed."), fallback: position > 0, configured: true, status: "ok", profile, durationMs: Date.now() - startedAt, usage: result.usage })
      return NextResponse.json({ ...result, response: position === 0 ? result.response : `Primary provider did not complete. 786.Chat completed this project with ${result.model || mode}.\n\n${result.response || ""}`.trim(), providerAttempts: attempts, providerStatus: providerSummary(attempts), providerFailoverUsed: position > 0, requestComplexity: isComplex ? "complex" : largeFrontendEdit ? "large-frontend-edit" : "simple" })
    } catch (error) {
      const reason = safeReason(error instanceof Error ? error.message : error)
      attempts.push({ mode, reason, fallback: position > 0, configured: true, status: attemptStatus(reason), profile, durationMs: Date.now() - startedAt })
    }
  }
  const diagnostic = attempts.map((attempt) => `${attempt.mode} (${attempt.status}): ${safeReason(attempt.reason)}`).join(" | ")
  console.error(`[786.Chat provider failure] ${diagnostic}`)
  return NextResponse.json({ success: false, error: compactFailure(attempts, isExistingEdit), warning: isExistingEdit ? "EDIT_NOT_APPLIED_PROJECT_PRESERVED" : "ALL_AI_PROVIDERS_FAILED", providerAttempts: attempts, providerStatus: providerSummary(attempts), providerFailoverUsed: attempts.some((attempt) => attempt.fallback), projectPreserved: isExistingEdit, requestComplexity: isComplex ? "complex" : largeFrontendEdit ? "large-frontend-edit" : "simple" }, { status: 503 })
}