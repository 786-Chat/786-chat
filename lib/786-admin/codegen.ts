import "server-only"
import { generateText, type FilePart, type ImagePart, type TextPart } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { BUILDER_MODELS, maxOutputTokensForPlan, normalizeGenerationUsage, type BuilderGenerationUsage } from "@/lib/786-chat/ai-provider-config"
import { fileUnitTargetFromPrompt, parseFileUnitOutput } from "@/lib/786-chat/file-unit-output"
import { boundedExistingProjectContext } from "@/lib/786-chat/provider-context"

export type CodegenMode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
export type CodegenAttachment = { url: string; mediaType: string; name?: string }
export type CodegenInput = { prompt: string; mode?: CodegenMode; abortSignal?: AbortSignal; userId?: string; userPlan?: string; generationId?: string; maxOutputTokens?: number; attachments?: CodegenAttachment[]; existing?: { title: string; description: string; fileTree: string[]; keyFiles: Record<string, string> } }
export type CodegenResult = { title: string; description: string; reply: string; files: Record<string, string>; model: string; reason: string; usage: BuilderGenerationUsage }

const FileSchema = z.object({ path: z.string().min(1), content: z.string(), language: z.string().optional() })
const ProjectSchema = z.object({ title: z.string().min(1), description: z.string().min(1), reply: z.string().min(1), files: z.array(FileSchema).min(1) })
const ExistingPatchSchema = z.object({
  path: z.string().min(1),
  search: z.string().min(1),
  replace: z.string(),
})
const ExistingEditSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  reply: z.string().optional(),
  patches: z.array(ExistingPatchSchema).optional().default([]),
  files: z.array(FileSchema).optional().default([]),
})
type ProjectObject = z.infer<typeof ProjectSchema>

const SYSTEM_PROMPT = `You are 786.Chat's structured project file generator. Return a real runnable Next.js App Router project as JSON.
Rules: For NEW projects return FULL file content, never diffs or placeholders. For EXISTING project edits, preserve all unrelated code and use exact targeted patch operations whenever modifying an existing file; only return full file content for brand-new files. app/page.tsx is mandatory for new projects. Use TypeScript and Tailwind CSS. Frontend imports may use react, next/*, lucide-react, clsx and tailwind-merge. Backend may use @neondatabase/serverless and zod when requested. Every internal slash href must have a matching app/**/page.tsx route. Keep shared UI reusable and route wrappers thin. Every JSX identifier must be declared/imported. For Neon initialize connections lazily and use parameterized queries. Return JSON only.`
const JSON_FORMAT_PROMPT = `\nReturn exactly one JSON object: {"title":"string","description":"string","reply":"string","files":[{"path":"string","content":"complete file content","language":"string"}]}. Begin with { and end with }. Escape JSON control characters. Keep metadata concise. Avoid duplicated code so the response fits the output budget.`
const EXISTING_EDIT_JSON_FORMAT_PROMPT = `\nReturn exactly one JSON object: {"title":"string","description":"string","reply":"string","patches":[{"path":"existing/file.tsx","search":"exact unique source text copied verbatim","replace":"replacement text"}],"files":[{"path":"brand-new-file.tsx","content":"complete new file content","language":"tsx"}]}. Use patches for every existing file. The search text must occur exactly once in that file and must NOT include excerpt marker comments. Use multiple small patches when different areas of one file must change. files is ONLY for brand-new paths. Do not return unchanged files. Begin with { and end with }.`
const FILE_UNIT_JSON_FORMAT_PROMPT = `\nReturn ONLY this tiny JSON object with no markdown or prose: {"path":"exact requested path","content":"complete file content"}. Do not return title, description, reply, a files array, or any other key. Begin with { and end with }.`
const TRUNCATION_MESSAGE = "DeepSeek JSON response was truncated before all project files were returned."
const COMPACT_RETRY_MESSAGE = "Provider response was too large or incomplete; retrying with compact project output."
const FILE_UNIT_RETRY_MAX_TOKENS = 8_000

function gatewayConfigured() { return Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || process.env.VERCEL === "1") }
function selectedMode(mode: CodegenMode, hasAttachments: boolean): CodegenMode { return hasAttachments ? "gemini-flash" : mode === "auto" ? "deepseek-flash" : mode }
function selectedModel(mode: CodegenMode) {
  if (mode === "gemini-flash") return { model: BUILDER_MODELS["gemini-flash"], reason: "Gemini Flash selected." }
  if (mode === "gemini-pro") return { model: BUILDER_MODELS["gemini-pro"], reason: "Gemini Pro selected manually." }
  if (mode === "deepseek-pro") return { model: "deepseek-v4-pro", reason: "DeepSeek V4 Pro selected manually." }
  return { model: "deepseek-v4-flash", reason: "DeepSeek V4 Flash selected." }
}

function decodeJsonString(value: string, fallback: string) { try { return JSON.parse(`"${value}"`) } catch { return fallback } }

function recoverTruncatedProject(text: string): ProjectObject | null {
  const files: Array<{ path: string; content: string; language?: string }> = []
  const re = /\{"path"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"content"\s*:\s*"((?:\\.|[^"\\])*)"(?:\s*,\s*"language"\s*:\s*"((?:\\.|[^"\\])*)")?\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const parsed = FileSchema.safeParse({ path: decodeJsonString(m[1], ""), content: decodeJsonString(m[2], ""), language: m[3] ? decodeJsonString(m[3], "") : undefined })
    if (parsed.success) files.push(parsed.data)
  }
  if (!files.length) return null
  const title = /"title"\s*:\s*"((?:\\.|[^"\\])*)"/.exec(text)?.[1]
  const description = /"description"\s*:\s*"((?:\\.|[^"\\])*)"/.exec(text)?.[1]
  const reply = /"reply"\s*:\s*"((?:\\.|[^"\\])*)"/.exec(text)?.[1]
  return { title: decodeJsonString(title || "", "Generated Project"), description: decodeJsonString(description || "", "Generated by 786.Chat"), reply: decodeJsonString(reply || "", "Project generated successfully."), files }
}

function extractProjectJson(text: string, allowRecovery = true): ProjectObject {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
  const start = trimmed.indexOf("{")
  if (start >= 0) for (let end = trimmed.lastIndexOf("}"); end > start; end = trimmed.lastIndexOf("}", end - 1)) {
    try { return ProjectSchema.parse(JSON.parse(trimmed.slice(start, end + 1))) } catch {}
  }
  const recovered = allowRecovery ? recoverTruncatedProject(trimmed) : null
  if (recovered) return recovered
  throw new Error("Provider JSON response could not be parsed or validated.")
}

function safeProjectPath(path: string) {
  return Boolean(path) && !path.startsWith("/") && !/(^|\/)\.\.(\/|$)/.test(path)
}

function occurrenceCount(content: string, search: string) {
  if (!search) return 0
  return content.split(search).length - 1
}

function extractExistingEditJson(text: string, input: CodegenInput): ProjectObject {
  if (!input.existing) throw new Error("Existing edit context is required.")
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
  const start = trimmed.indexOf("{")
  let parsed: z.infer<typeof ExistingEditSchema> | null = null

  if (start >= 0) {
    for (let end = trimmed.lastIndexOf("}"); end > start; end = trimmed.lastIndexOf("}", end - 1)) {
      try {
        const candidate = ExistingEditSchema.safeParse(JSON.parse(trimmed.slice(start, end + 1)))
        if (candidate.success) {
          parsed = candidate.data
          break
        }
      } catch {}
    }
  }
  if (!parsed) throw new Error("Existing-project edit JSON could not be parsed or validated.")

  const working = { ...input.existing.keyFiles }
  const changed: Record<string, string> = {}

  for (const patch of parsed.patches) {
    if (!safeProjectPath(patch.path) || !(patch.path in working)) {
      throw new Error(`Existing-project patch targeted an invalid or missing path: ${patch.path}`)
    }
    const current = working[patch.path]
    const matches = occurrenceCount(current, patch.search)
    if (matches !== 1) {
      throw new Error(`Existing-project patch search must match exactly once in ${patch.path}; found ${matches}.`)
    }
    const next = current.replace(patch.search, patch.replace)
    working[patch.path] = next
    changed[patch.path] = next
  }

  for (const file of parsed.files) {
    if (!safeProjectPath(file.path)) throw new Error(`Generated file path is invalid: ${file.path}`)
    if (file.path in input.existing.keyFiles) {
      throw new Error(`Existing files must be changed with targeted patches, not full-file replacement: ${file.path}`)
    }
    changed[file.path] = file.content
  }

  if (!Object.keys(changed).length) throw new Error("Existing-project edit did not produce any safe file changes.")

  return {
    title: parsed.title?.trim() || input.existing.title,
    description: parsed.description?.trim() || input.existing.description,
    reply: parsed.reply?.trim() || "Updated the requested project area and preserved unrelated code.",
    files: Object.entries(changed).map(([path, content]) => ({ path, content })),
  }
}

function buildPrompt(input: CodegenInput) {
  const fileUnitTarget = fileUnitTargetFromPrompt(input.prompt)
  if (fileUnitTarget) return ["MODE: FILE UNIT", `EXACT TARGET PATH: ${fileUnitTarget}`, "USER REQUEST:", input.prompt.trim(), "Generate only the exact target file with complete content."].join("\n") + FILE_UNIT_JSON_FORMAT_PROMPT
  if (!input.existing) return [`MODE: NEW PROJECT`, `USER REQUEST:`, input.prompt.trim(), `Generate the complete requested project using shared components and compact route wrappers.`].join("\n") + JSON_FORMAT_PROMPT
  const boundedKeyFiles = boundedExistingProjectContext(input.prompt, input.existing.keyFiles)
  return ["MODE: EDIT EXISTING PROJECT WITH TARGETED PATCHES", `EXISTING TITLE: ${input.existing.title}`, `EXISTING DESCRIPTION: ${input.existing.description}`, "ALL EXISTING FILE PATHS:", [...input.existing.fileTree].sort().join("\n"), "RELEVANT EXISTING FILE CONTENTS (BOUNDED):", Object.entries(boundedKeyFiles).map(([p, c]) => `--- FILE: ${p} ---\n${c}\n--- END FILE ---`).join("\n\n"), "USER REQUEST:", input.prompt.trim(), "Change only the requested area. Copy each patch search string exactly from the real source shown above, make it unique, and preserve every unrelated area. Use files only when the user genuinely needs a brand-new file."].join("\n") + EXISTING_EDIT_JSON_FORMAT_PROMPT
}
function compactRetryPrompt(prompt: string, existing: boolean) {
  if (/\bFILE-LEVEL FULL-STACK GENERATION\b/i.test(prompt)) return `${prompt}\n\n${COMPACT_RETRY_MESSAGE}\nONE FILE RETRY — HARD OUTPUT BOUND: Output ONLY {"path":"exact requested path","content":"complete file content"} with no markdown, prose, metadata, files array, or extra keys, in at most 6,000 output tokens. Never return a prefix, continuation, patch, or partial file. If repeated data would exceed the bound, replace it with concise deterministic code that produces the same behavior.`
  if (existing) return `${prompt}\n\n${COMPACT_RETRY_MESSAGE}\nEXISTING PROJECT RETRY: Return only small exact patches for existing files and complete content only for brand-new files. Keep title, description and reply extremely short. Every patch search string must be copied verbatim and match exactly once.`
  return `${prompt}\n\n${COMPACT_RETRY_MESSAGE}\nNEW PROJECT RETRY: Generate the smallest COMPLETE runnable project satisfying EVERY explicit requirement. Keep every requested route, API, schema and functional control. Use shared components, thin route wrappers and one concise stylesheet. Do not include documentation, tests, duplicate data, decorative SVG, base64 images or unnecessary configuration. Keep title, description and reply extremely short.`
}
function attachmentContent(prompt: string, attachments: CodegenAttachment[]): Array<TextPart | ImagePart | FilePart> { const c: Array<TextPart | ImagePart | FilePart> = [{ type: "text", text: prompt }]; for (const a of attachments) c.push(a.mediaType.startsWith("image/") ? { type: "image", image: a.url, mediaType: a.mediaType } : { type: "file", data: a.url, mediaType: a.mediaType, filename: a.name || "attachment" }); return c }

function extractGeneratedObject(text: string, input: CodegenInput): ProjectObject {
  const target = fileUnitTargetFromPrompt(input.prompt)
  if (target) {
    const file = parseFileUnitOutput(text, target)
    return { title: "Generated application", description: "Generated by 786.Chat", reply: "File generated.", files: [file] }
  }
  if (input.existing) return extractExistingEditJson(text, input)
  return extractProjectJson(text)
}

async function runDeepSeek(input: CodegenInput, prompt: string, mode: CodegenMode) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  const requestedTokens = input.maxOutputTokens ?? maxOutputTokensForPlan(input.userPlan)
  const model = mode === "deepseek-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash"

  if (!apiKey) {
    if (!gatewayConfigured()) throw new Error("DeepSeek direct API key and Vercel AI Gateway are not configured.")
    const gatewayModel = model === "deepseek-v4-pro" ? BUILDER_MODELS["deepseek-pro"] : BUILDER_MODELS["deepseek-flash"]
    const result = await generateText({
      model: gatewayModel,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.1,
      maxOutputTokens: Math.min(requestedTokens, 24000),
      maxRetries: 0,
      abortSignal: input.abortSignal,
      providerOptions: {
        gateway: {
          user: input.userId || "anonymous-builder",
          tags: ["feature:builder-codegen", `plan:${String(input.userPlan || "starter").toLowerCase()}`, `env:${process.env.VERCEL_ENV || process.env.NODE_ENV || "development"}`, ...(input.generationId ? [`generation:${input.generationId}`] : [])],
          zeroDataRetention: true,
        },
        deepseek: { thinking: { type: "disabled" } },
      },
    })
    if (!result.text?.trim()) throw new Error("DeepSeek Gateway returned no output text.")
    let object: ProjectObject
    try { object = extractGeneratedObject(result.text, input) } catch (error) {
      if (/JSON response could not be parsed|did not contain a JSON object/i.test(error instanceof Error ? error.message : String(error))) throw new Error(TRUNCATION_MESSAGE)
      throw error
    }
    return { object, usage: result.usage }
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }], thinking: { type: "disabled" }, response_format: { type: "json_object" }, temperature: 0.1, max_tokens: Math.min(requestedTokens, 24000), stream: false }), signal: input.abortSignal })
  const payload = await response.json().catch(() => ({})) as { error?: { message?: string }; choices?: Array<{ finish_reason?: string; message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }
  if (!response.ok) throw new Error(`DeepSeek API ${response.status}: ${payload.error?.message || "request failed"}`)
  const choice = payload.choices?.[0]
  const text = choice?.message?.content || ""
  let object: ProjectObject
  try { object = extractGeneratedObject(text, input) } catch (error) {
    if (choice?.finish_reason === "length") throw new Error(TRUNCATION_MESSAGE)
    throw error
  }
  if (choice?.finish_reason === "length" && (fileUnitTargetFromPrompt(input.prompt) || !input.existing)) throw new Error(TRUNCATION_MESSAGE)
  return { object, usage: { inputTokens: payload.usage?.prompt_tokens || 0, outputTokens: payload.usage?.completion_tokens || 0, totalTokens: payload.usage?.total_tokens || 0 } }
}

async function runGemini(input: CodegenInput, prompt: string, modelName: string) {
  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()
  const directModel = modelName.replace(/^google\//, "")
  const model = googleApiKey ? createGoogleGenerativeAI({ apiKey: googleApiKey })(directModel) : modelName
  if (!googleApiKey && !gatewayConfigured()) throw new Error("Gemini is not configured.")
  const requestedTokens = input.maxOutputTokens ?? maxOutputTokensForPlan(input.userPlan)
  const result = await generateText({ model, system: SYSTEM_PROMPT, ...(input.attachments?.length ? { messages: [{ role: "user" as const, content: attachmentContent(prompt, input.attachments) }] } : { prompt }), temperature: 0.1, maxOutputTokens: Math.min(requestedTokens, 24000), maxRetries: 0, abortSignal: input.abortSignal, ...(typeof model === "string" ? { providerOptions: { gateway: { user: input.userId || "anonymous-builder", tags: ["feature:builder-codegen", `plan:${String(input.userPlan || "starter").toLowerCase()}`, `env:${process.env.VERCEL_ENV || process.env.NODE_ENV || "development"}`, ...(input.generationId ? [`generation:${input.generationId}`] : [])], zeroDataRetention: true } } } : {}) })
  if (!result.text?.trim()) throw new Error("Gemini returned no output text.")
  return { object: extractGeneratedObject(result.text, input), usage: result.usage }
}

export async function generateProjectCode(input: CodegenInput): Promise<CodegenResult> {
  const attachments = input.attachments || []
  const mode = selectedMode(input.mode ?? "auto", attachments.length > 0)
  const picked = selectedModel(mode)
  const prompt = buildPrompt(input)
  let result
  if (mode === "deepseek-flash" || mode === "deepseek-pro") {
    try { result = await runDeepSeek(input, prompt, mode) }
    catch (error) {
      const retryable = error instanceof Error && /JSON response (?:could not be parsed|was truncated)|did not contain a JSON object|File unit returned the wrong path/i.test(error.message)
      if (!retryable) throw error
      result = await runDeepSeek({ ...input, maxOutputTokens: Math.min(input.maxOutputTokens ?? FILE_UNIT_RETRY_MAX_TOKENS, FILE_UNIT_RETRY_MAX_TOKENS) }, compactRetryPrompt(prompt, Boolean(input.existing)), mode)
    }
  } else {
    try { result = await runGemini(input, prompt, picked.model) }
    catch (error) {
      const retryable = error instanceof Error && /no output|JSON response could not be parsed|did not contain a JSON object|File unit returned the wrong path/i.test(error.message)
      if (!retryable) throw error
      result = await runGemini(input, compactRetryPrompt(prompt, Boolean(input.existing)), picked.model)
    }
  }
  const files: Record<string, string> = {}
  for (const file of result.object.files) if (file.path && file.content) files[file.path] = file.content
  if (!Object.keys(files).length) throw new Error("Codegen returned zero usable files.")
  return { title: result.object.title, description: result.object.description, reply: result.object.reply, files, model: picked.model, reason: picked.reason, usage: normalizeGenerationUsage(result.usage, picked.model) }
}