import "server-only"
import { generateText, type FilePart, type ImagePart, type TextPart } from "ai"
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
  // Images/files always use Gemini Flash. Never silently upgrade to a paid Pro model.
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
    return { model: BUILDER_MODELS["deepseek-pro"], reason: "DeepSeek Pro selected manually." }
  }
  return { model: BUILDER_MODELS["deepseek-flash"], reason: "DeepSeek Flash selected." }
}

function extractProjectJson(text: string): ProjectObject {
  const trimmed = text.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")

  const start = trimmed.indexOf("{")
  if (start < 0) throw new Error("Provider response did not contain a JSON object.")

  // Find the last complete closing brace. This tolerates provider preambles or
  // trailing text while still validating the resulting project with Zod.
  for (let end = trimmed.lastIndexOf("}"); end > start; end = trimmed.lastIndexOf("}", end - 1)) {
    try {
      return ProjectSchema.parse(JSON.parse(trimmed.slice(start, end + 1)))
    } catch {
      // Try an earlier closing brace. If none parse, report a structured error.
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

async function runDeepSeek(input: CodegenInput, prompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  if (!apiKey) throw new Error("DeepSeek direct API key is not configured.")

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: Math.min(input.maxOutputTokens ?? maxOutputTokensForPlan(input.userPlan), 7_000),
      stream: false,
    }),
    signal: input.abortSignal,
  })

  const payload = await response.json().catch(() => ({})) as {
    error?: { message?: string }
    choices?: Array<{ finish_reason?: string; message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  }

  if (!response.ok) {
    throw new Error(`DeepSeek API ${response.status}: ${payload.error?.message || "request failed"}`)
  }

  const choice = payload.choices?.[0]
  if (choice?.finish_reason === "length") {
    throw new Error("DeepSeek JSON response was truncated before all project files were returned.")
  }

  return {
    object: extractProjectJson(choice?.message?.content || ""),
    usage: {
      inputTokens: payload.usage?.prompt_tokens || 0,
      outputTokens: payload.usage?.completion_tokens || 0,
      totalTokens: payload.usage?.total_tokens || 0,
    },
  }
}

async function runGemini(input: CodegenInput, prompt: string, modelName: string) {
  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()
  const directModel = modelName.replace(/^google\//, "")

  const model = googleApiKey
    ? createGoogleGenerativeAI({ apiKey: googleApiKey })(directModel)
    : modelName

  if (!googleApiKey && !gatewayConfigured()) {
    throw new Error("Gemini is not configured.")
  }

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    ...(input.attachments?.length
      ? { messages: [{ role: "user" as const, content: attachmentContent(prompt, input.attachments) }] }
      : { prompt }),
    temperature: 0.1,
    maxOutputTokens: Math.min(input.maxOutputTokens ?? maxOutputTokensForPlan(input.userPlan), 7_000),
    maxRetries: 0,
    abortSignal: input.abortSignal,
    ...(typeof model === "string" ? {
      providerOptions: {
        gateway: {
          user: input.userId || "anonymous-builder",
          tags: [
            "feature:builder-codegen",
            `plan:${String(input.userPlan || "starter").toLowerCase()}`,
            `env:${process.env.VERCEL_ENV || process.env.NODE_ENV || "development"}`,
            ...(input.generationId ? [`generation:${input.generationId}`] : []),
          ],
          zeroDataRetention: true,
        },
      },
    } : {}),
  })

  return {
    object: extractProjectJson(result.text),
    usage: result.usage,
  }
}

export async function generateProjectCode(input: CodegenInput): Promise<CodegenResult> {
  const attachments = input.attachments || []
  const mode = selectedMode(input.mode ?? "auto", attachments.length > 0)
  const picked = selectedModel(mode)
  const prompt = buildPrompt(input)

  // Run exactly the provider selected by provider-controller. Provider failover
  // belongs to the outer controller so one codegen call cannot silently consume
  // a second provider's timeout budget.
  const result = mode === "deepseek-flash" || mode === "deepseek-pro"
    ? await runDeepSeek(input, prompt)
    : await runGemini(input, prompt, picked.model)

  const files: Record<string, string> = {}
  for (const file of result.object.files) {
    if (file.path && file.content) files[file.path] = file.content
  }
  if (!Object.keys(files).length) throw new Error("Codegen returned zero usable files.")

  return {
    title: result.object.title,
    description: result.object.description,
    reply: result.object.reply,
    files,
    model: picked.model,
    reason: picked.reason,
    usage: normalizeGenerationUsage(result.usage, picked.model),
  }
}
