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
  if (mode === "gemini-flash") return { provider: "gemini" as const, model: "gemini-2.5-flash", reason: "Manual Gemini Flash mode." }
  if (mode === "gemini-pro") return { provider: "gemini" as const, model: "gemini-2.5-pro", reason: "Manual Gemini Pro mode." }

  const vision = hasAny(prompt, ["image", "screenshot", "photo", "picture", "pdf", "document", "scan", "logo"])
  const complex = hasAny(prompt, ["architecture", "full platform", "complete platform", "multi tenant", "database schema", "deployment pipeline", "security", "billing system", "marketplace system", "production ready", "entire system"])

  if (vision) {
    return complex
      ? { provider: "gemini" as const, model: "gemini-2.5-pro", reason: "Auto selected Gemini Pro for complex image, PDF, screenshot, or document work." }
      : { provider: "gemini" as const, model: "gemini-2.5-flash", reason: "Auto selected Gemini Flash for image, PDF, screenshot, or document work." }
  }

  return complex
    ? { provider: "deepseek" as const, model: "deepseek-v4-pro", reason: "Auto selected DeepSeek Pro for complex platform, architecture, database, security, or deployment work." }
    : { provider: "deepseek" as const, model: "deepseek-v4-flash", reason: "Auto selected DeepSeek Flash for normal chat and coding." }
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
