import "server-only"
import { generateText } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { withCircuitBreaker, withRetry } from "@/lib/786-admin/reliability"

export type SevenEightSixModelMode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"

export type SevenEightSixRouterResult = {
  success: boolean
  provider: "deepseek" | "gemini"
  model: string
  mode: SevenEightSixModelMode
  reason: string
  response: string
  error?: string
}

type SelectedModel = {
  provider: "deepseek" | "gemini"
  model: string
  reason: string
}

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY || "" })
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "" })

function hasAny(text: string, words: string[]) {
  const value = text.toLowerCase()
  return words.some((word) => value.includes(word))
}

function chooseModel(prompt: string, mode: SevenEightSixModelMode): SelectedModel {
  if (mode === "deepseek-flash") return { provider: "deepseek", model: "deepseek-v4-flash", reason: "Manual Flash mode." }
  if (mode === "deepseek-pro") return { provider: "deepseek", model: "deepseek-v4-pro", reason: "Manual Pro mode." }
  if (mode === "gemini-flash") return { provider: "gemini", model: "gemini-3.5-flash", reason: "Manual Gemini Flash mode." }
  if (mode === "gemini-pro") return { provider: "gemini", model: "gemini-2.5-pro", reason: "Manual Gemini Pro mode." }

  const complexPlatform = hasAny(prompt, [
    "786.chat",
    "architecture",
    "full platform",
    "complete platform",
    "database schema",
    "deployment pipeline",
    "security",
    "billing system",
    "marketplace system",
    "production ready",
    "entire system",
    "real project saving",
    "github sync",
    "vercel deploy",
    "build the full",
    "project engine",
    "file engine",
    "preview engine",
  ])

  const explicitVision = hasAny(prompt, [
    "analyze image",
    "analyze screenshot",
    "read pdf",
    "scan pdf",
    "ocr",
    "uploaded image",
    "uploaded screenshot",
    "attached image",
    "attached screenshot",
    "look at this image",
    "look at this screenshot",
  ])

  if (complexPlatform) {
    return { provider: "deepseek", model: "deepseek-v4-pro", reason: "Auto selected DeepSeek Pro for complex 786.Chat platform, architecture, database, GitHub, Vercel, or deployment work." }
  }

  if (explicitVision) {
    return { provider: "gemini", model: "gemini-3.5-flash", reason: "Auto selected Gemini 3.5 Flash for a direct visual, screenshot, OCR, or PDF task." }
  }

  return { provider: "deepseek", model: "deepseek-v4-flash", reason: "Auto selected DeepSeek Flash for normal chat and coding." }
}

const system = `You are 786.Chat, an owner-only AI software architect and coding assistant.
Focus on the new 786.Chat admin system.
Support Next.js, React, TypeScript, JavaScript, HTML, CSS, Tailwind, PHP, Python, and SQL.
Give clear, practical steps. Explain what files would be needed before changing code.`

function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return !message.includes("401") && !message.includes("403") && !message.includes("invalid api key") && !message.includes("unauthorized")
}

async function generateWithReliability(selected: SelectedModel, prompt: string): Promise<string> {
  return withCircuitBreaker({
    key: `ai:${selected.provider}`,
    failureThreshold: 4,
    resetAfterMs: 30_000,
    operation: () =>
      withRetry(
        async () => {
          const model = selected.provider === "deepseek" ? deepseek(selected.model) : google(selected.model)
          const result = await generateText({ model, system, prompt, temperature: 0.35 })
          return result.text || "The model returned an empty response."
        },
        {
          attempts: 3,
          timeoutMs: 45_000,
          baseDelayMs: 400,
          maxDelayMs: 3_000,
          shouldRetry: isRetryable,
        },
      ),
  })
}

function fallbackFor(selected: SelectedModel): SelectedModel {
  if (selected.provider === "deepseek") {
    return { provider: "gemini", model: "gemini-2.5-pro", reason: `${selected.reason} DeepSeek failed, so Gemini Pro was used as the automatic fallback.` }
  }
  return { provider: "deepseek", model: "deepseek-v4-pro", reason: `${selected.reason} Gemini failed, so DeepSeek Pro was used as the automatic fallback.` }
}

export async function routeSevenEightSixPrompt(prompt: string, mode: SevenEightSixModelMode = "auto"): Promise<SevenEightSixRouterResult> {
  const cleanPrompt = prompt.trim()
  const selected = chooseModel(cleanPrompt, mode)

  if (!cleanPrompt) {
    return { success: false, provider: selected.provider, model: selected.model, mode, reason: "Empty prompt.", response: "", error: "Please enter a message first." }
  }

  try {
    const response = await generateWithReliability(selected, cleanPrompt)
    return { success: true, provider: selected.provider, model: selected.model, mode, reason: selected.reason, response }
  } catch (primaryError) {
    if (mode !== "auto") {
      return { success: false, provider: selected.provider, model: selected.model, mode, reason: selected.reason, response: "", error: primaryError instanceof Error ? primaryError.message : "786.Chat AI router failed." }
    }

    const fallback = fallbackFor(selected)
    try {
      const response = await generateWithReliability(fallback, cleanPrompt)
      return { success: true, provider: fallback.provider, model: fallback.model, mode, reason: fallback.reason, response }
    } catch (fallbackError) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : "Primary provider failed."
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "Fallback provider failed."
      return {
        success: false,
        provider: selected.provider,
        model: selected.model,
        mode,
        reason: selected.reason,
        response: "",
        error: `Primary provider failed: ${primaryMessage} Fallback provider failed: ${fallbackMessage}`,
      }
    }
  }
}
