import "server-only"
import { generateText, Output, type FilePart, type ImagePart, type TextPart } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

import {
  BUILDER_MODELS,
  maxOutputTokensForPlan,
  normalizeGenerationUsage,
  type BuilderGenerationUsage,
} from "@/lib/786-chat/ai-provider-config"

export type CodegenMode =
  | "auto"
  | "deepseek-flash"
  | "deepseek-pro"
  | "gemini-flash"
  | "gemini-pro"

export type CodegenAttachment = { url: string; mediaType: string; name?: string }

export type CodegenInput = {
  prompt: string
  mode?: CodegenMode
  abortSignal?: AbortSignal
  userId?: string
  userPlan?: string
  generationId?: string
  maxOutputTokens?: number
  attachments?: CodegenAttachment[]
  existing?: { title: string; description: string; fileTree: string[]; keyFiles: Record<string, string> }
}

export type CodegenResult = {
  title: string
  description: string
  reply: string
  files: Record<string, string>
  model: string
  reason: string
  usage: BuilderGenerationUsage
}

const FileSchema = z.object({ path: z.string().min(1), content: z.string(), language: z.string().optional() })
const ProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  reply: z.string().min(1),
  files: z.array(FileSchema).min(1),
})
type ProjectObject = z.infer<typeof ProjectSchema>

const SYSTEM_PROMPT = `You are 786.Chat's structured project file generator.
Return a real runnable Next.js App Router project as JSON.

Rules:
- Return FULL file content, never diffs or placeholders.
- app/page.tsx is mandatory for new projects; for existing-project edits, return it only when the requested change modifies it.
- Use TypeScript and Tailwind CSS.
- Frontend imports may use react, next/*, lucide-react, clsx and tailwind-merge.
- Backend files may also use @neondatabase/serverless and zod when requested.
- Preserve existing files and behavior for edits; emit only new or modified files.
- Every internal slash href must have a matching app/**/page.tsx route.
- Keep shared UI in reusable components and route wrappers thin.
- Keep CSS compact and CSS-first for animation.
- Every identifier used in JSX must be declared or imported.
- For Neon, initialize the connection lazily inside getSql/getDb and never require DATABASE_URL during module import.
- For Neon query results, never call .length or [0] on the raw tagged-template return type. Normalize awaited results to typed rows before indexing.
- Use parameterized database queries.
- Every requested backend API/schema/migration file must be real code, not mock data.
- Return JSON only, with no markdown fences or prose outside the JSON object.`

const JSON_FORMAT_PROMPT = `

OUTPUT FORMAT — MANDATORY:
Return exactly one JSON object with this shape:
{"title":"string","description":"string","reply":"string","files":[{"path":"string","content":"complete file content","language":"string"}]}
The response must begin with { and end with }.
Escape newlines, quotes, backslashes, tabs and control characters correctly inside file content.
Do not use markdown fences.
Keep title, description and reply concise.
Avoid duplicated JSX, CSS and backend helpers so the complete response fits within the output budget.`

const TRUNCATION_MESSAGE = "DeepSeek JSON response was truncated before all project files were returned."
const COMPACT_RETRY_MESSAGE = "Provider response was too large or incomplete; retrying with compact project output."

function gatewayConfigured() {
  return Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || process.env.VERCEL === "1")
}

function selectedMode(mode: CodegenMode, hasAttachments: boolean): CodegenMode {
  if (hasAttachments) return "gemini-flash"
  return mode === "auto" ? "deepseek-flash" : mode
}

function selectedModel(mode: CodegenMode): { model: string; reason: string } {
  if (mode === "gemini-flash") return { model: BUILDER_MODELS["gemini-flash"], reason: "Gemini Flash selected." }
  if (mode === "gemini-pro") return { model: BUILDER_MODELS["gemini-pro"], reason: "Gemini Pro selected manually." }
  if (mode === "deepseek-pro") return { model: "deepseek-v4-pro", reason: "DeepSeek V4 Pro selected manually." }
  return { model: "deepseek-v4-flash", reason: "DeepSeek V4 Flash selected." }
}

function extractProjectJson(text: string): ProjectObject {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
  const start = trimmed.indexOf("{")
  if (start < 0) throw new Error("Provider response did not contain a JSON object.")
  for (let end = trimmed.lastIndexOf("}"); end > start; end = trimmed.lastIndexOf("}", end - 1)) {
    try { return ProjectSchema.parse(JSON.parse(trimmed.slice(start, end + 1))) } catch { /* try earlier boundary */ }
  }
  throw new Error("Provider JSON response could not be parsed or validated.")
}

function buildPrompt(input: CodegenInput) {
  const parts: string[] = []
  if (input.existing) {
    parts.push(
      "MODE: EDIT EXISTING PROJECT",
      `EXISTING TITLE: ${input.existing.title}`,
      `EXISTING DESCRIPTION: ${input.existing.description}`,
      "",
      "ALL EXISTING FILE PATHS:",
      [...input.existing.fileTree].sort().join("\n"),
      "",
      "KEY FILE CONTENTS:",
      Object.entries(input.existing.keyFiles).map(([path, content]) => `--- FILE: ${path} ---\n${content}\n--- END FILE ---`).join("\n\n"),
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Emit only files that are new or modified. Preserve unrelated files and functionality.",
    )
  } else {
    parts.push("MODE: NEW PROJECT", "", "USER REQUEST:", input.prompt.trim(), "", "Generate the complete requested project. Use shared components and compact route wrappers.")
  }
  return `${parts.join("\n")}${JSON_FORMAT_PROMPT}`
}

function compactRetryPrompt(prompt: string, existing: boolean) {
  return existing
    ? `${prompt}\n\nRETRY AFTER OUTPUT LIMIT — EXISTING PROJECT EDIT:\nThe previous response exceeded the provider output limit. Return ONLY the smallest set of files directly changed by the current user request. Do not resend unchanged routes, shared styles, package files, schema files, helpers, components or APIs. Include backend/schema files only when this exact edit requires them. Return complete content for each changed file. Preserve all unrelated existing files implicitly.`
    : `${prompt}\n\nRETRY AFTER OUTPUT LIMIT — NEW PROJECT:\nThe previous response exceeded the provider output limit. Generate the smallest COMPLETE runnable project that still satisfies every explicit requirement in the user request. Use one shared component for navigation, footer, cards and repeated sections; use thin route wrappers; centralize CSS and server helpers. Do not include documentation, tests, duplicate data, decorative SVG, base64 images or unnecessary config. Every explicitly requested route and required backend/schema file must still be present and valid. Keep title, description and reply extremely short.`
}

function attachmentContent(prompt: string, attachments: CodegenAttachment[]): Array<TextPart | ImagePart | FilePart> {
  const content: Array<TextPart | ImagePart | FilePart> = [{ type: "text", text: prompt }]
  for (const attachment of attachments) {
    if (attachment.mediaType.startsWith("image/")) content.push({ type: "image", image: attachment.url, mediaType: attachment.mediaType })
    else content.push({ type: "file", data: attachment.url, mediaType: attachment.mediaType, filename: attachment.name || "attachment" })
  }
  return content
}

async function runDeepSeek(input: CodegenInput, prompt: string, mode: CodegenMode) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  if (!apiKey) throw new Error("DeepSeek direct API key is not configured.")
  const requestedTokens = input.maxOutputTokens ?? maxOutputTokensForPlan(input.userPlan)
  const model = mode === "deepseek-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash"
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: Math.min(requestedTokens, 12_000),
      stream: false,
    }),
    signal: input.abortSignal,
  })
  const payload = await response.json().catch(() => ({})) as {
    error?: { message?: string }
    choices?: Array<{ finish_reason?: string; message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  }
  if (!response.ok) throw new Error(`DeepSeek API ${response.status}: ${payload.error?.message || "request failed"}`)
  const choice = payload.choices?.[0]
  if (choice?.finish_reason === "length") throw new Error(TRUNCATION_MESSAGE)
  return {
    object: extractProjectJson(choice?.message?.content || ""),
    usage: { inputTokens: payload.usage?.prompt_tokens || 0, outputTokens: payload.usage?.completion_tokens || 0, totalTokens: payload.usage?.total_tokens || 0 },
  }
}

async function runGemini(input: CodegenInput, prompt: string, modelName: string) {
  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()
  const directModel = modelName.replace(/^google\//, "")
  const model = googleApiKey ? createGoogleGenerativeAI({ apiKey: googleApiKey })(directModel) : modelName
  if (!googleApiKey && !gatewayConfigured()) throw new Error("Gemini is not configured.")
  const requestedTokens = input.maxOutputTokens ?? maxOutputTokensForPlan(input.userPlan)
  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: ProjectSchema, name: "project", description: "Complete runnable Next.js project with full file contents." }),
    ...(input.attachments?.length ? { messages: [{ role: "user" as const, content: attachmentContent(prompt, input.attachments) }] } : { prompt }),
    temperature: 0.1,
    maxOutputTokens: Math.min(requestedTokens, 12_000),
    maxRetries: 0,
    abortSignal: input.abortSignal,
    ...(typeof model === "string" ? { providerOptions: { gateway: { user: input.userId || "anonymous-builder", tags: ["feature:builder-codegen", `plan:${String(input.userPlan || "starter").toLowerCase()}`, `env:${process.env.VERCEL_ENV || process.env.NODE_ENV || "development"}`, ...(input.generationId ? [`generation:${input.generationId}`] : [])], zeroDataRetention: true } } } : {}),
  })
  return { object: result.output, usage: result.usage }
}

export async function generateProjectCode(input: CodegenInput): Promise<CodegenResult> {
  const attachments = input.attachments || []
  const mode = selectedMode(input.mode ?? "auto", attachments.length > 0)
  const picked = selectedModel(mode)
  const prompt = buildPrompt(input)
  let result
  if (mode === "deepseek-flash" || mode === "deepseek-pro") {
    try {
      result = await runDeepSeek(input, prompt, mode)
    } catch (error) {
      const truncated = error instanceof Error && error.message === TRUNCATION_MESSAGE
      if (!truncated) throw error
      const retryInput: CodegenInput = { ...input, maxOutputTokens: 8_000 }
      result = await runDeepSeek(retryInput, compactRetryPrompt(prompt, Boolean(input.existing)), mode)
    }
  } else {
    result = await runGemini(input, prompt, picked.model)
  }
  const files: Record<string, string> = {}
  for (const file of result.object.files) if (file.path && file.content) files[file.path] = file.content
  if (!Object.keys(files).length) throw new Error("Codegen returned zero usable files.")
  return { title: result.object.title, description: result.object.description, reply: result.object.reply, files, model: picked.model, reason: picked.reason, usage: normalizeGenerationUsage(result.usage, picked.model) }
}
