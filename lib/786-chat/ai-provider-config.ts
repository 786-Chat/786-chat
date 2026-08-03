import "server-only"

export type BuilderProvider = "deepseek" | "gemini"

export type BuilderGenerationUsage = {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

export const BUILDER_MODELS = {
  "deepseek-flash": "deepseek/deepseek-v4-flash",
  "deepseek-pro": "deepseek/deepseek-v4-pro",
  "gemini-flash": "google/gemini-3.5-flash",
  "gemini-pro": "google/gemini-3.1-pro-preview",
} as const

const TOKEN_PRICE_USD: Record<string, { input: number; output: number }> = {
  "deepseek/deepseek-v4-flash": { input: 0.0000002, output: 0.0000004 },
  "deepseek/deepseek-v4-pro": { input: 0.000000435, output: 0.00000087 },
  "google/gemini-3.5-flash": { input: 0.0000015, output: 0.000009 },
  "google/gemini-3.1-pro-preview": { input: 0.000002, output: 0.000012 },
}

function finiteTokenCount(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

export function providerForModel(model: string): BuilderProvider {
  return model.startsWith("google/") ? "gemini" : "deepseek"
}

export function normalizeGenerationUsage(
  usage: unknown,
  model: string,
): BuilderGenerationUsage {
  const value = usage && typeof usage === "object"
    ? usage as Record<string, unknown>
    : {}
  const inputTokens = finiteTokenCount(value.inputTokens ?? value.promptTokens)
  const outputTokens = finiteTokenCount(value.outputTokens ?? value.completionTokens)
  const totalTokens = finiteTokenCount(value.totalTokens) || inputTokens + outputTokens
  const pricing = TOKEN_PRICE_USD[model] || { input: 0, output: 0 }
  const estimatedCostUsd = Number(
    (inputTokens * pricing.input + outputTokens * pricing.output).toFixed(8),
  )
  return { inputTokens, outputTokens, totalTokens, estimatedCostUsd }
}

export function mergeGenerationUsage(
  ...values: Array<BuilderGenerationUsage | null | undefined>
): BuilderGenerationUsage {
  const merged = values.reduce<BuilderGenerationUsage>((total, value) => ({
    inputTokens: total.inputTokens + Number(value?.inputTokens || 0),
    outputTokens: total.outputTokens + Number(value?.outputTokens || 0),
    totalTokens: total.totalTokens + Number(value?.totalTokens || 0),
    estimatedCostUsd: total.estimatedCostUsd + Number(value?.estimatedCostUsd || 0),
  }), { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 })
  return { ...merged, estimatedCostUsd: Number(merged.estimatedCostUsd.toFixed(8)) }
}

export function maxOutputTokensForPlan(plan: string | undefined) {
  switch (String(plan || "starter").toLowerCase()) {
    case "business":
    case "enterprise":
      return 24_000
    case "pro":
      return 18_000
    case "basic":
      return 14_000
    default:
      return 10_000
  }
}
