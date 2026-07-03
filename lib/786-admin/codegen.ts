import "server-only"
import { generateObject } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

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
  attachment?: CodegenAttachment
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
}

const FileSchema = z.object({
  path: z.string().min(1).describe("Relative file path from the project root."),
  content: z.string().describe("FULL file content. Never diffs or placeholders."),
  language: z.string().optional(),
})

const ProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  reply: z.string().min(1),
  files: z.array(FileSchema).min(1),
})

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY || "" })
const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    "",
})

function pickModel(mode: CodegenMode, hasAttachment: boolean): {
  provider: "deepseek" | "gemini"
  model: string
  reason: string
} {
  if (hasAttachment) {
    if (mode === "gemini-flash") {
      return { provider: "gemini", model: "gemini-2.5-flash", reason: "Gemini Flash selected for image/file analysis." }
    }
    return { provider: "gemini", model: "gemini-2.5-pro", reason: "Gemini Pro selected because an image or file was attached." }
  }

  if (mode === "deepseek-flash") return { provider: "deepseek", model: "deepseek-v4-flash", reason: "Manual DeepSeek Flash." }
  if (mode === "deepseek-pro") return { provider: "deepseek", model: "deepseek-v4-pro", reason: "Manual DeepSeek Pro." }
  if (mode === "gemini-flash") return { provider: "gemini", model: "gemini-2.5-flash", reason: "Manual Gemini Flash." }
  if (mode === "gemini-pro") return { provider: "gemini", model: "gemini-2.5-pro", reason: "Manual Gemini Pro." }

  return {
    provider: "deepseek",
    model: "deepseek-v4-pro",
    reason: "Auto: DeepSeek v4 Pro for structured code generation.",
  }
}

const SYSTEM_PROMPT = `You are 786.Chat's structured project file generator.

Your ONLY job is to emit a real Next.js App Router project as a list of files.

ABSOLUTE RULES:
1. ALWAYS emit FULL file content for every file you return. Never diffs or placeholders.
2. Use Next.js App Router with TypeScript and Tailwind CSS.
3. Only import from react, next/*, lucide-react, clsx, and tailwind-merge.
4. For edits, emit ONLY files being created or modified and preserve unrelated design and functionality.
5. Match the user's request precisely.
6. Every identifier used in JSX or render logic must be declared or imported.
7. Define every dataset before it is used.
8. Avoid custom React context providers and custom useX hooks. Prefer local state.
9. The preview must run immediately in an iframe.
10. When an image or screenshot is attached, inspect it carefully and use it as visual context for the user's requested edit. Do not merely describe the image.
11. If the image shows mobile UI, reproduce the requested mobile behavior while preserving desktop behavior unless the user asks otherwise.
12. Never claim an image-driven change was made unless the returned files actually implement it.`

export async function generateProjectCode(input: CodegenInput): Promise<CodegenResult> {
  const mode: CodegenMode = input.mode ?? "auto"
  const picked = pickModel(mode, Boolean(input.attachment))
  const model = picked.provider === "deepseek" ? deepseek(picked.model) : google(picked.model)

  const promptParts: string[] = []

  if (input.existing) {
    const tree = [...input.existing.fileTree].sort().join("\n")
    const keyFilesText = Object.entries(input.existing.keyFiles)
      .map(([p, c]) => `--- FILE: ${p} ---\n${c}\n--- END FILE ---`)
      .join("\n\n")

    promptParts.push(
      "MODE: EDIT EXISTING PROJECT",
      `EXISTING TITLE: ${input.existing.title}`,
      `EXISTING DESCRIPTION: ${input.existing.description}`,
      "",
      "ALL EXISTING FILE PATHS:",
      tree,
      "",
      "KEY FILE CONTENTS:",
      keyFilesText,
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Emit ONLY files you are creating or modifying.",
      "Preserve all unrelated design, layout, data, and functionality.",
      "If an attached screenshot is supplied, use it to understand the exact requested placement and responsive behavior."
    )
  } else {
    promptParts.push(
      "MODE: NEW PROJECT",
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Emit a complete Next.js App Router project with app/page.tsx, app/layout.tsx, app/globals.css, and any required components.",
      "The project must run immediately without missing variables or providers."
    )
  }

  const userPrompt = promptParts.join("\n")

  const request: Parameters<typeof generateObject>[0] = {
    model,
    schema: ProjectSchema,
    system: SYSTEM_PROMPT,
    temperature: 0.15,
    prompt: userPrompt,
  }

  if (input.attachment) {
    const attachment = input.attachment
    const content = attachment.mediaType.startsWith("image/")
      ? [
          { type: "text", text: userPrompt },
          { type: "image", image: attachment.url, mediaType: attachment.mediaType },
        ]
      : [
          { type: "text", text: userPrompt },
          { type: "file", data: attachment.url, mediaType: attachment.mediaType, filename: attachment.name || "attachment" },
        ]

    delete (request as { prompt?: string }).prompt
    ;(request as unknown as { messages: unknown[] }).messages = [
      { role: "user", content },
    ]
  }

  const result = await generateObject(request)

  const filesMap: Record<string, string> = {}
  for (const f of result.object.files) {
    if (!f.path || !f.content) continue
    filesMap[f.path] = f.content
  }

  if (Object.keys(filesMap).length === 0) {
    throw new Error("Codegen returned zero usable files.")
  }

  return {
    title: result.object.title,
    description: result.object.description,
    reply: result.object.reply,
    files: filesMap,
    model: picked.model,
    reason: picked.reason,
  }
}
