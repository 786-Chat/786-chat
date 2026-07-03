import "server-only"
import { generateObject } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

// Subsystem #3 — Structured project codegen.
// Replaces the keyword-switch template in local-project-generator.ts.
// The local generator is now ONLY used as an emergency fallback by the
// chat route when this function throws.
//
// Strategy:
//   - generateObject (Vercel AI SDK) + Zod schema forces the model to emit
//     a real list of files, not prose.
//   - "Auto" and "deepseek-pro" both route to DeepSeek v4 Pro.
//   - When `existing` is provided we tell the model it is EDITING and feed
//     it the entry files (app/page.tsx, app/layout.tsx, README.md) plus a file-tree listing.

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
  if (mode === "deepseek-flash") return { provider: "deepseek", model: "deepseek-v4-flash", reason: "Manual DeepSeek Flash." }
  if (mode === "deepseek-pro") return { provider: "deepseek", model: "deepseek-v4-pro", reason: "Manual DeepSeek Pro." }
  if (mode === "gemini-flash") return { provider: "gemini", model: "gemini-3.5-flash", reason: "Manual Gemini Flash." }
  if (mode === "gemini-pro") return { provider: "gemini", model: "gemini-2.5-pro", reason: "Manual Gemini Pro." }

  return {
    provider: "deepseek",
    model: "deepseek-v4-pro",
    reason: "Auto: DeepSeek v4 Pro for structured code generation.",
  }
}

const SYSTEM_PROMPT = `You are 786.Chat's structured project file generator.

Your ONLY job is to emit a real Next.js (App Router) project as a list of files.

ABSOLUTE RULES:
1. ALWAYS emit FULL file content for every file you return. Never use diffs, never use placeholders like "// ...same as before".
2. Use modern Next.js 16+ App Router conventions: app/page.tsx, app/layout.tsx, app/globals.css.
3. Use TypeScript and Tailwind CSS utility classes. Mark client components with "use client".
4. Keep files self-contained. Only import from: react, next/*, lucide-react, clsx, tailwind-merge.
5. Do NOT emit package.json, tsconfig.json, next.config.js, postcss.config.js, tailwind.config.* — those are pre-provisioned.
6. Match the user's intent precisely. Do NOT return a generic landing page when the user asked for a specific feature.
7. If editing an existing project (you will be given the entry files and a full file tree), emit ONLY the files you need to create or modify. Do NOT re-emit unchanged files. Keep the existing project title unless the user explicitly asks to rename it.
8. The "reply" field must be a short chat message (1–3 sentences) describing what you produced or changed. It is NOT the file content.
9. NEVER output the literal string "786.Chat Generated Project" as a title. Always derive a real title from the user's prompt or keep the existing one when editing.

RUNTIME-SAFE CODE RULES:
10. Every identifier used in JSX or render logic MUST be declared in the same emitted file or imported from another emitted file. Never reference undeclared variables such as categoryData, productData, products, stats, slides, testimonials, pricingPlans, navItems, features, or categories.
11. For arrays used with .map(), ALWAYS define the array before the component returns JSX. Example: const categories = [...] before categories.map(...).
12. For NEW projects, prefer a self-contained app/page.tsx with local arrays and helper functions unless splitting into components is necessary. If you split into components, every imported component and data file MUST be included in the emitted files array.
13. Do not use browser APIs that commonly fail in a sandbox on first render. Avoid direct constructors on load for AudioContext, WebGL, MediaRecorder, SpeechRecognition, WebSocket, Worker, SharedWorker, Notification, PaymentRequest, Bluetooth, USB, Serial, or EyeDropper. If interaction sound is requested, implement it behind a user click handler with try/catch.
14. Before finalizing, mentally TypeScript-check the emitted files: no missing imports, no missing variables, no undeclared arrays, no duplicate default exports, no syntax errors.
15. The preview must be able to run immediately inside an iframe using only the emitted files. If a feature needs data, define sample data in the emitted code.

CONTEXT / PROVIDER RULES:
16. For generated preview projects, DO NOT create custom React Context providers or hooks such as FilterProvider, useFilter, CartProvider, useCart, WishlistProvider, useWishlist, ThemeProvider, or useTheme.
17. Do NOT throw errors like "useX must be used within XProvider". Generated preview apps must not depend on provider wrapper order.
18. Use simple local useState, useMemo, and plain props inside app/page.tsx for filters, cart, wishlist, search, sliders, tabs, modals, and UI state.
19. If a provider is absolutely necessary, the default export Page component MUST wrap every consumer inside the provider in the same file. But prefer not to use providers at all.
20. Ecommerce projects must keep product, category, cart, wishlist, search, and filter state self-contained in app/page.tsx. No custom context hooks.`

export async function generateProjectCode(input: CodegenInput): Promise<CodegenResult> {
  const mode: CodegenMode = input.mode ?? "auto"
  const picked = pickModel(mode)
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
      "KEY FILE CONTENTS (for context):",
      keyFilesText,
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Emit ONLY the files you are creating or modifying. Keep the existing title unless the user explicitly requests a rename.",
      "Do not introduce undeclared variables. If you add JSX that maps over data, define that data in the same modified file or include the imported data file.",
      "Do not introduce custom React Context providers/hooks. If the existing project has a provider bug, remove the provider/hook and replace it with local state in app/page.tsx."
    )
  } else {
    promptParts.push(
      "MODE: NEW PROJECT",
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Emit a complete Next.js App Router project: app/page.tsx, app/layout.tsx, app/globals.css, plus any components and lib files the project needs. Derive a real title from the user's request — do NOT use a generic name.",
      "The project must run in preview immediately with no ReferenceError. Every dataset used by the UI must be declared: products, categories, categoryData, productData, testimonials, slides, features, stats, pricingPlans, navItems, etc.",
      "Do not use React Context providers or custom useX hooks. For ecommerce, implement cart, wishlist, categories, search and filters with local useState/useMemo in app/page.tsx."
    )
  }

  const userPrompt = promptParts.join("\n")

  const result = await generateObject({
    model,
    schema: ProjectSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.15,
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
