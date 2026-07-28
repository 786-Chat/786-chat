import { NextResponse } from "next/server"
import { POST as runLegacyGenerator } from "@/app/api/786-admin/chat/route"
import type { CodegenMode } from "@/lib/786-admin/codegen"

export const runtime = "nodejs"
export const maxDuration = 60
const AI_ATTEMPT_TIMEOUT_MS = 25_000

type GeneratorPayload = Record<string, unknown> & { mode?: CodegenMode; attachments?: unknown[]; existing?: unknown }
type GeneratorResult = Record<string, unknown> & { success?: boolean; response?: string; model?: string; reason?: string; fellBackToLocal?: boolean }

function alternateMode(mode: CodegenMode, hasAttachments: boolean): CodegenMode {
  if (hasAttachments) return mode === "gemini-flash" ? "gemini-pro" : "gemini-flash"
  if (mode === "gemini-flash" || mode === "gemini-pro") return "deepseek-pro"
  return "gemini-pro"
}

function attemptTimeout<T>(promise: Promise<T>, mode: CodegenMode): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${mode} did not finish within the provider failover window.`)), AI_ATTEMPT_TIMEOUT_MS)),
  ])
}

async function runAttempt(request: Request, payload: GeneratorPayload, mode: CodegenMode): Promise<GeneratorResult> {
  const headers = new Headers(request.headers)
  headers.set("content-type", "application/json")
  headers.set("x-786-resilient-attempt", mode)
  const attemptRequest = new Request(request.url, { method: "POST", headers, body: JSON.stringify({ ...payload, mode }) })
  const response = await attemptTimeout(runLegacyGenerator(attemptRequest), mode)
  return response.json().catch(() => ({ success: false, reason: `Invalid response from ${mode}.` })) as Promise<GeneratorResult>
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as GeneratorPayload
  const requested = String(payload.mode || "auto") as CodegenMode
  const primaryMode: CodegenMode = ["auto", "deepseek-flash", "deepseek-pro", "gemini-flash", "gemini-pro"].includes(requested) ? requested : "auto"
  const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0
  const isExistingEdit = Boolean(payload.existing && typeof payload.existing === "object")
  const secondaryMode = alternateMode(primaryMode, hasAttachments)
  const attempts: Array<{ mode: CodegenMode; model?: string; reason?: string; fallback: boolean }> = []

  try {
    const primary = await runAttempt(request, payload, primaryMode)
    attempts.push({ mode: primaryMode, model: String(primary.model || ""), reason: String(primary.reason || ""), fallback: Boolean(primary.fellBackToLocal) })
    if (primary.success && !primary.fellBackToLocal) return NextResponse.json({ ...primary, providerAttempts: attempts, providerFailoverUsed: false })
  } catch (error) {
    attempts.push({ mode: primaryMode, reason: error instanceof Error ? error.message : "Primary provider failed.", fallback: false })
  }

  try {
    const secondary = await runAttempt(request, payload, secondaryMode)
    attempts.push({ mode: secondaryMode, model: String(secondary.model || ""), reason: String(secondary.reason || ""), fallback: Boolean(secondary.fellBackToLocal) })
    if (secondary.success && !secondary.fellBackToLocal) {
      return NextResponse.json({
        ...secondary,
        response: `Primary AI provider was unavailable. 786.Chat automatically completed this project with ${secondary.model || secondaryMode}.\n\n${secondary.response || ""}`.trim(),
        providerAttempts: attempts,
        providerFailoverUsed: true,
      })
    }

    if (isExistingEdit) {
      return NextResponse.json({
        success: false,
        error: "Both AI providers were unavailable. Your existing project was kept unchanged; the edit was not applied. Please retry.",
        warning: "EDIT_NOT_APPLIED_PROJECT_PRESERVED",
        providerAttempts: attempts,
        providerFailoverUsed: true,
        projectPreserved: true,
      }, { status: 503 })
    }

    return NextResponse.json({
      ...secondary,
      response: "⚠ AI FALLBACK USED\n\nDeepSeek/Gemini could not complete this new-project request after two attempts. The preview was created by the limited local fallback generator, not by the selected AI model.",
      reason: attempts.map((attempt) => `${attempt.mode}: ${attempt.reason || attempt.model || "failed"}`).join(" | "),
      providerAttempts: attempts,
      providerFailoverUsed: true,
      fellBackToLocal: true,
      warning: "AI_FALLBACK_USED",
    })
  } catch (error) {
    attempts.push({ mode: secondaryMode, reason: error instanceof Error ? error.message : "Secondary provider failed.", fallback: false })
    return NextResponse.json({
      success: false,
      error: isExistingEdit ? "Both AI providers failed. Your existing project was kept unchanged." : "Both AI providers failed before a project could be generated. Please retry.",
      warning: isExistingEdit ? "EDIT_NOT_APPLIED_PROJECT_PRESERVED" : "ALL_AI_PROVIDERS_FAILED",
      providerAttempts: attempts,
      projectPreserved: isExistingEdit,
    }, { status: 503 })
  }
}
