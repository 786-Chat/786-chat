import "server-only"
import { generateText } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

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

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY || "" })
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "" })

function hasAny(text: string, words: string[]) {
  const value = text.toLowerCase()
  return words.some((word) => value.includes(word))
}

function chooseModel(prompt: string, mode: SevenEightSixModelMode) {
  if (mode === "deepseek-flash") return { provider: "deepseek" as const, model: "deepseek-v4-flash", reason: "Manual Flash mode." }
  if (mode === "deepseek-pro") return { provider: "deepseek" as const, model: "deepseek-v4-pro", reason: "Manual Pro mode." }
  if (mode === "gemini-flash") return { provider: "gemini" as const, model: "gemini-3.5-flash", reason: "Manual Gemini Flash mode." }
  if (mode === "gemini-pro") return { provider: "gemini" as const, model: "gemini-2.5-pro", reason: "Manual Gemini Pro mode." }

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
    return { provider: "deepseek" as const, model: "deepseek-v4-pro", reason: "Auto selected DeepSeek Pro for complex 786.Chat platform, architecture, database, GitHub, Vercel, or deployment work." }
  }

  if (explicitVision) {
    return { provider: "gemini" as const, model: "gemini-3.5-flash", reason: "Auto selected Gemini 3.5 Flash for a direct visual, screenshot, OCR, or PDF task." }
  }

  return { provider: "deepseek" as const, model: "deepseek-v4-flash", reason: "Auto selected DeepSeek Flash for normal chat and coding." }
}

const system = `You are 786.Chat, an owner-only AI software architect and coding assistant.
Focus on the new 786.Chat admin system.
Support Next.js, React, TypeScript, JavaScript, HTML, CSS, Tailwind, PHP, Python, and SQL.
Give clear, practical steps. Explain what files would be needed before changing code.`

export async function routeSevenEightSixPrompt(prompt: string, mode: SevenEightSixModelMode = "auto"): Promise<SevenEightSixRouterResult> {
  const cleanPrompt = prompt.trim()
  const selected = chooseModel(cleanPrompt, mode)

  if (!cleanPrompt) {
    return { success: false, provider: selected.provider, model: selected.model, mode, reason: "Empty prompt.", response: "", error: "Please enter a message first." }
  }

  try {
    const model = selected.provider === "deepseek" ? deepseek(selected.model) : google(selected.model)
    const result = await generateText({ model, system, prompt: cleanPrompt, temperature: 0.35 })
    return { success: true, provider: selected.provider, model: selected.model, mode, reason: selected.reason, response: result.text || "The model returned an empty response." }
  } catch (error) {
    return { success: false, provider: selected.provider, model: selected.model, mode, reason: selected.reason, response: "", error: error instanceof Error ? error.message : "786.Chat AI router failed." }
  }
}
