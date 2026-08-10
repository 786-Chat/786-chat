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

export type CodegenAttachment = {
  url: string
  mediaType: string
  name?: string
}

export type CodegenInput = {
  prompt: string
  mode?: CodegenMode
  abortSignal?: AbortSignal
  userId?: string
  userPlan?: string
  generationId?: string
  maxOutputTokens?: number
  attachments?: CodegenAttachment[]
  existing?: {
    title: string
    description: string
    fileTree: string[]
    keyFiles: Record<string, string>
  }
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

const FileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  language: z.string().optional(),
})

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
- app/page.tsx is mandatory.
- Use TypeScript and Tailwind CSS.
- Frontend imports may use react, next/*, lucide-react, clsx and tailwind-merge.
- Backend files may also use @neondatabase/serverless and zod when requested.
- Preserve existing files and behavior for edits; emit only new or modified files.
- Every internal slash href must have a matching app/**/page.tsx route.
- Keep shared UI in reusable components and route wrappers thin.
- Keep CSS compact and CSS-first for animation.
- Every identifier used in JSX must be declared or imported.
- For Neon, initialize the connection lazily inside getSql/getDb and never require DATABASE_URL during module import.
- For Neon query results, never call .length or [0] on the raw tagged-template return type. Either use a query() helper that returns { rows } and access result.rows, or explicitly normalize the awaited result to a typed row array before indexing.
- When using neon() as a query function with a SQL string, pass bind parameters as ONE array: await sql(text, params || []). NEVER spread params into positional arguments such as sql(text, ...params); that is invalid for @neondatabase/serverless and can fail at runtime with errors such as "t.map is not a function".
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

function gatewayConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim() ||
    process.env.VERCEL === "1",
  )
}

function selectedMode(mode: CodegenMode, hasAttachments: boolean): CodegenMode {
  if (hasAttachments) return "gemini-flash"
  return mode === "auto" ? "deepseek-flash" : mode
}

function selectedModel(mode: CodegenMode): { model: string; reason: string } {
  if (mode === "gemini-flash") {
    return { model: BUILDER_MODELS["gemini-flash"], reason: "Gemini Flash selected." }
  }
  if (mode === "gemini-pro") {
    return { model: BUILDER_MODELS["gemini-pro"], reason: "Gemini Pro selected manually." }
  }
  if (mode === "deepseek-pro") {
    return { model: "deepseek-v4-pro", reason: "DeepSeek V4 Pro selected manually." }
  }
  return { model: "deepseek-v4-flash", reason: "DeepSeek V4 Flash selected." }
}

function extractProjectJson(text: string): ProjectObject {
  const trimmed = text.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")

  const start = trimmed.indexOf("{")
  if (start < 0) throw new Error("Provider response did not contain a JSON object.")

  for (let end = trimmed.lastIndexOf("}"); end > start; end = trimmed.lastIndexOf("}", end - 1)) {
    try {
      return ProjectSchema.parse(JSON.parse(trimmed.slice(start, end + 1)))
    } catch {
      // Try an earlier complete object boundary.
    }
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
      Object.entries(input.existing.keyFiles)
        .map(([path, content]) => `--- FILE: ${path} ---\n${content}\n--- END FILE ---`)
        .join("\n\n"),
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Emit only files that are new or modified. Preserve unrelated files and functionality.",
    )
  } else {
    parts.push(
      "MODE: NEW PROJECT",
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Generate the complete requested project. Use shared components and compact route wrappers.",
    )
  }
  return `${parts.join("\n")}${JSON_FORMAT_PROMPT}`
}

function attachmentContent(prompt: string, attachments: CodegenAttachment[]): Array<TextPart | ImagePart | FilePart> {
  const content: Array<TextPart | ImagePart | FilePart> = [{ type: "text", text: prompt }]
  for (const attachment of attachments) {
    if (attachment.mediaType.startsWith("image/")) {
      content.push({ type: "image", image: attachment.url, mediaType: attachment.mediaType })
    } else {
      content.push({
        type: "file",
        data: attachment.url,
        mediaType: attachment.mediaType,
        filename: attachment.name || "attachment",
      })
    }
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
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: Math.min(requestedTokens, 48_000),
      stream: false,
    }),
    signal: input.abortSignal,
  })
  if (!response.ok) throw new Error(`DeepSeek failed (${response.status})`)
  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content || ""
  return { text, model, usage: data?.usage }
}

async function runGemini(input: CodegenInput, prompt: string, mode: CodegenMode) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  if (!apiKey && !gatewayConfigured()) throw new Error("Gemini API access is not configured.")
  const google = createGoogleGenerativeAI(apiKey ? { apiKey } : undefined)
  const selected = selectedModel(mode)
  const response = await generateText({
    model: google(selected.model),
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: attachmentContent(prompt, input.attachments || []) }],
    maxOutputTokens: input.maxOutputTokens ?? maxOutputTokensForPlan(input.userPlan),
    abortSignal: input.abortSignal,
  })
  return { text: response.text, model: selected.model, usage: response.usage }
}

export async function generateProjectFiles(input: CodegenInput): Promise<CodegenResult> {
  const mode = selectedMode(input.mode || "auto", Boolean(input.attachments?.length))
  const prompt = buildPrompt(input)
  const selected = selectedModel(mode)
  let generated: { text: string; model: string; usage: any }

  try {
    generated = mode.startsWith("gemini")
      ? await runGemini(input, prompt, mode)
      : await runDeepSeek(input, prompt, mode)
  } catch (primaryError) {
    if (mode !== "deepseek-flash") throw primaryError
    generated = await runGemini(input, prompt, "gemini-flash")
  }

  const project = extractProjectJson(generated.text)
  const files = Object.fromEntries(project.files.map((file) => [file.path, file.content]))
  return {
    title: project.title,
    description: project.description,
    reply: project.reply,
    files,
    model: generated.model,
    reason: selected.reason,
    usage: normalizeGenerationUsage(generated.usage),
  }
}
