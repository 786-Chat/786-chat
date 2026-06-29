import "server-only"
import { generateObject } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

// Subsystem #3 — Structured project codegen.
// This module forces the AI provider to return real file maps instead of prose
// or preview placeholders. The admin chat route persists these files into Neon.

export type CodegenMode =
  | "auto"
  | "deepseek-flash"
  | "deepseek-pro"
  | "gemini-flash"
  | "gemini-pro"

export type CodegenInput = {
  prompt: string
  mode?: CodegenMode
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
  path: z
    .string()
    .min(1)
    .describe(
      "Relative file path from the project root, e.g. 'app/page.tsx', 'components/footer.tsx'."
    ),
  content: z
    .string()
    .describe(
      "FULL file content. Always emit the complete file body, never diffs, never placeholders."
    ),
  language: z
    .string()
    .optional()
    .describe("Language hint such as 'tsx', 'ts', 'css', 'json', or 'md'."),
})

const ProjectSchema = z.object({
  title: z
    .string()
    .min(1)
    .describe(
      "Short, human-readable project title derived from the user's prompt. When editing, keep the existing title unchanged unless the user explicitly asks to rename."
    ),
  description: z
    .string()
    .min(1)
    .describe("A single sentence describing what the project does."),
  reply: z
    .string()
    .min(1)
    .describe(
      "A 1–3 sentence chat-style reply that explains what you produced or changed. NOT file content."
    ),
  files: z
    .array(FileSchema)
    .min(1)
    .describe(
      "Files to create or update. For a NEW project, emit a complete Next.js App Router scaffold (app/page.tsx, app/layout.tsx, app/globals.css, plus any components and lib files). For an EDIT, emit ONLY the files you are creating or changing."
    ),
})

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY || "" })
const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    "",
})

function pickModel(mode: CodegenMode): {
  provider: "deepseek" | "gemini"
  model: string
  reason: string
} {
  if (mode === "deepseek-flash") {
    return {
      provider: "deepseek",
      model: "deepseek-v4-flash",
      reason: "Manual DeepSeek Flash.",
    }
  }

  if (mode === "deepseek-pro") {
    return {
      provider: "deepseek",
      model: "deepseek-v4-pro",
      reason: "Manual DeepSeek Pro.",
    }
  }

  if (mode === "gemini-flash") {
    return {
      provider: "gemini",
      model: "gemini-3.5-flash",
      reason: "Manual Gemini Flash.",
    }
  }

  if (mode === "gemini-pro") {
    return {
      provider: "gemini",
      model: "gemini-2.5-pro",
      reason: "Manual Gemini Pro.",
    }
  }

  return {
    provider: "deepseek",
    model: "deepseek-v4-pro",
    reason: "Auto: DeepSeek v4 Pro for structured code generation.",
  }
}

const SYSTEM_PROMPT = `You are 786.Chat's structured project file generator.

Your ONLY job is to emit a real Next.js App Router project as a list of files.

ABSOLUTE RULES:
1. ALWAYS emit FULL file content for every file you return. Never use diffs, never use placeholders like "// ...same as before".
2. Use modern Next.js App Router conventions: app/page.tsx, app/layout.tsx, app/globals.css.
3. Use TypeScript and Tailwind CSS utility classes. Mark client components with "use client" when state or browser events are needed.
4. Keep files self-contained. Only import from: react, next/*, lucide-react, clsx, tailwind-merge.
5. Do NOT emit package.json, tsconfig.json, next.config.js, postcss.config.js, tailwind.config.* — those are pre-provisioned.
6. Match the user's intent precisely. Do NOT return a generic landing page when the user asked for a specific feature.
7. If editing an existing project, emit ONLY the files you need to create or modify. Do NOT re-emit unchanged files. Keep the existing project title unless the user explicitly asks to rename it.
8. The reply field must be a short chat message describing what you produced or changed. It is NOT file content.
9. NEVER output the literal string "786.Chat Generated Project" or "786.Chat Generated Website" as a title. Always derive a real title from the user request or keep the existing title when editing.`

export async function generateProjectCode(
  input: CodegenInput
): Promise<CodegenResult> {
  const mode: CodegenMode = input.mode ?? "auto"
  const picked = pickModel(mode)
  const model =
    picked.provider === "deepseek"
      ? deepseek(picked.model)
      : google(picked.model)

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
      "KEY FILE CONTENTS (for context):",
      keyFilesText,
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Emit ONLY the files you are creating or modifying. Keep the existing title unless the user explicitly requests a rename."
    )
  } else {
    promptParts.push(
      "MODE: NEW PROJECT",
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Emit a complete Next.js App Router project: app/page.tsx, app/layout.tsx, app/globals.css, plus any components and lib files the project needs. Derive a real title from the user's request — do NOT use a generic name."
    )
  }

  const result = await generateObject({
    model,
    schema: ProjectSchema,
    system: SYSTEM_PROMPT,
    prompt: promptParts.join("\n"),
    temperature: 0.3,
  })

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
