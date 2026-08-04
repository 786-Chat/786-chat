import "server-only"
import { generateObject, generateText, type FilePart, type ImagePart, type TextPart } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
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

function gatewayConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim() ||
    process.env.VERCEL === "1",
  )
}

function providerModel(modelName: string, forceGateway = false) {
  if (
    !forceGateway &&
    modelName.startsWith("deepseek/") &&
    process.env.DEEPSEEK_API_KEY?.trim()
  ) {
    const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY.trim() })
    // Vercel AI Gateway exposes versioned DeepSeek routing IDs, while the
    // direct DeepSeek API documents the stable deepseek-chat alias. Keeping
    // those identifiers separate avoids sending a Gateway-only ID to the
    // direct endpoint.
    return deepseek("deepseek-chat")
  }

  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()
  if (modelName.startsWith("google/") && googleApiKey) {
    const google = createGoogleGenerativeAI({ apiKey: googleApiKey })
    return google(modelName.slice("google/".length))
  }

  // A string model identifier is intentionally retained when no direct key is
  // present so Vercel AI Gateway remains a supported managed fallback.
  return modelName
}

function pickModel(mode: CodegenMode, hasAttachments: boolean): {
  provider: "deepseek" | "gemini"
  model: string
  reason: string
} {
  if (hasAttachments) {
    if (mode === "gemini-flash") {
      return { provider: "gemini", model: BUILDER_MODELS["gemini-flash"], reason: "Gemini Flash selected for image/file analysis." }
    }
    return { provider: "gemini", model: BUILDER_MODELS["gemini-pro"], reason: "Gemini Pro selected because one or more images/files were attached." }
  }

  if (mode === "deepseek-flash") return { provider: "deepseek", model: BUILDER_MODELS["deepseek-flash"], reason: "Manual DeepSeek Flash." }
  if (mode === "deepseek-pro") return { provider: "deepseek", model: BUILDER_MODELS["deepseek-pro"], reason: "Manual DeepSeek Pro." }
  if (mode === "gemini-flash") return { provider: "gemini", model: BUILDER_MODELS["gemini-flash"], reason: "Manual Gemini Flash." }
  if (mode === "gemini-pro") return { provider: "gemini", model: BUILDER_MODELS["gemini-pro"], reason: "Manual Gemini Pro." }

  return {
    provider: "deepseek",
    model: BUILDER_MODELS["deepseek-pro"],
    reason: "Auto: DeepSeek v4 Pro is primary for structured code generation.",
  }
}

const PREMIUM_DESIGN_ENGINE_PROMPT = `
PREMIUM DESIGN / ANIMATION ENGINE PERMISSIONS:
You are allowed and encouraged to create polished, premium, Canva-like visual systems when the user asks for design, effects, animation, 3D, luxury, VVIP, modern, stylish, or premium UI.

Allowed without extra dependencies:
- Advanced Tailwind/CSS animations: fade, slide, zoom, blur, reveal, float, pulse, shimmer, marquee, wave, bounce, glow, spin, morph, and scroll-feel section animation.
- 3D-style UI using CSS transforms: perspective, rotateX, rotateY, translateZ, preserve-3d, hover tilt, 3D cards, 3D buttons, 3D text shadows, layered depth, neon depth, and product-card depth.
- Premium text design: gradient text, stroke text, glowing text, shadow text, large editorial typography, split-word styling, typewriter-like effects, letter-spacing effects, animated underline, and luxury heading composition.
- Premium surfaces: glassmorphism, neumorphism, claymorphism, bento grids, floating cards, frosted panels, blur overlays, soft shadows, light beams, radial highlights, metallic/gold accents, and luxury dark UI.
- Background systems: animated gradients, blobs, mesh gradients, particles made with CSS spans/divs, waves, grid overlays, aurora, smoke/fog-like CSS layers, starfields, confetti-like CSS particles, and video/image overlays when requested.
- Interaction effects: magnetic-feel buttons, hover lifts, hover glow, ripple-style buttons, active states, open/close panels, tabs, modals, drawers, dropdowns, accordions, carousels, sliders, filters, carts, dashboards, and forms.
- Responsive design: desktop, tablet, iPad, and mobile must each look intentional, not squeezed.
- Font/design variety: use CSS font-family stacks and Tailwind typography classes to create premium font feels. Do not import remote fonts unless the existing project already does.

Safety / performance rules:
- Keep animations lightweight and CSS-first.
- Do not add new npm packages such as framer-motion, three.js, gsap, spline, lottie, or canvas libraries unless they already exist in the project files. Simulate premium effects using CSS/Tailwind/React state instead.
- Do not create infinite heavy loops, uncontrolled timers, or expensive canvas animations.
- Keep all buttons, forms, carts, filters, search, booking, checkout, and project functionality working.
- For edits, never redesign unrelated sections unless the user explicitly asks for a full redesign.
- If the user asks for 3D/4D/5D/6D, interpret this as stronger depth, perspective, lighting, motion, layered parallax, immersive typography, and premium interaction effects. Implement practical CSS/React effects that run in the preview.
- If the user asks for Canva-like editing, change the exact target area: text, color, font feel, logo, background, section, card, button, layout, or image. Preserve the rest.
- Every generated icon/component/function/state variable must be declared. No missing variables. No invalid imports.
- All import statements must remain at the top of each returned file. Never place import or export statements after executable code.
`

const ROUTE_INTEGRITY_PROMPT = `
PROJECT ROUTE INTEGRITY — MANDATORY:
- Every internal navigation href that begins with "/" MUST have a matching real App Router page file in the final project.
- Route mapping examples:
  "/" requires app/page.tsx.
  "/menu" requires app/menu/page.tsx.
  "/about" requires app/about/page.tsx.
  "/contact" requires app/contact/page.tsx.
  "/payment-method" requires app/payment-method/page.tsx.
- Never render Menu, About, Contact, Booking, Checkout, Dashboard, Admin, Shop, Products, Services, Gallery, Login, Register, or any other route link unless its matching page file already exists or is returned in the same response.
- For a one-page project, use section anchors such as "#menu", "#about", and "#contact", and create matching section id attributes in app/page.tsx.
- Do not use a slash route as a substitute for an in-page section.
- Do not create decorative, dead, placeholder, or fake navigation links.
- When editing an existing project, inspect ALL EXISTING FILE PATHS before adding navigation. A path absent from the file tree is not a real page unless you create its page.tsx file in the same response.
- The final navigation must be fully consistent with the final returned file tree.
`

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
10. Inspect every attached image or file carefully and use all of them as visual context.
11. When multiple screenshots are attached, compare them and infer the requested before/after placement, layout, and responsive behavior.
12. If an image shows mobile UI, reproduce the requested mobile behavior while preserving desktop behavior unless the user asks otherwise.
13. Never claim an image-driven change was made unless the returned files actually implement it.
14. Never add fake success text; only say what the returned files actually changed.
15. Never leave duplicate imports, mid-file imports, or imports with comments after executable code.
16. If a Next.js config file is needed, use next.config.mjs. Never create next.config.ts because supported generated-project Next.js versions may reject it.
17. For multi-company systems, lib/server/tenant.ts must explicitly reject missing or mismatched company ownership with a forbidden/unauthorized error.
18. Every POST, PATCH and DELETE API mutation must validate input and persist a tenant-scoped audit_logs event. Collection and item route files must call the real audit implementation; comments do not count.
19. Keep audit writes in the same database transaction as the business mutation whenever the generated database helper supports transactions.
20. Every tenant-scoped collection and item API route must reference companyId and call requireTenant, requireCompany, tenantGuard, or assertTenant before reading or mutating data.
21. Every required operational page must implement a real form, table, state-changing button, onSubmit, onClick, useState, or data mutation action. Static marketing cards do not count as an operational system.
22. Implement every requested workflow as functional page, API, contract or schema code using the explicit domain terms. CRM must include a sales follow-up task and notification, not merely a generic activity.
23. Every generated Next.js project must include app/page.tsx. A nested route such as app/login/page.tsx never replaces the root entry file; the root may render or redirect to the requested nested page.

${ROUTE_INTEGRITY_PROMPT}
${PREMIUM_DESIGN_ENGINE_PROMPT}`

const STRUCTURED_RETRY_PROMPT = `

STRUCTURED OUTPUT RETRY:
Your previous response could not be parsed into the required project object.
Return exactly one schema-valid project object and nothing outside it.
Keep title, description, and reply concise.
Return complete file contents, but reduce duplication by using a small number of reusable shared components.
HARD OUTPUT LIMIT: the complete JSON response must stay below 6,500 output tokens.
For multi-page websites, create one compact shared page component and make route files thin wrappers that pass data or variants into it.
Keep app/globals.css concise. Do not repeat navigation, footer, arrays, large SVG, or section JSX across route files.
Do not use markdown fences, prose before the object, prose after the object, comments outside file contents, or partial files.
Ensure every file entry has a non-empty path and complete string content.
`

const DEEPSEEK_JSON_PROMPT = `

DEEPSEEK JSON RESPONSE FORMAT — MANDATORY:
Return one valid JSON object only with this exact shape:
{"title":"string","description":"string","reply":"string","files":[{"path":"string","content":"complete file content","language":"string"}]}
The response must begin with { and end with }.
Encode every newline, quote, backslash, tab, and control character inside file content as valid JSON.
Do not use Markdown fences or write any text outside the JSON object.
Keep the entire JSON response below 7,000 output tokens. Reuse compact shared components instead of repeating JSX or CSS between pages.
`

function errorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  return String(error)
}

function isStructuredOutputError(error: unknown): boolean {
  return /no object generated|could not parse|failed to parse|parse error|invalid json|json response|truncated|finish.?reason.*length|schema validation|did not match the schema|noobjectgenerated/i.test(errorMessage(error))
}

function parseDeepSeekProject(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start < 0 || end <= start) {
    throw new Error("DeepSeek JSON response did not contain a complete object.")
  }
  try {
    return ProjectSchema.parse(JSON.parse(trimmed.slice(start, end + 1)))
  } catch (error) {
    throw new Error(`DeepSeek JSON response could not be parsed or validated: ${errorMessage(error)}`)
  }
}

export async function generateProjectCode(input: CodegenInput): Promise<CodegenResult> {
  const mode: CodegenMode = input.mode ?? "auto"
  const attachments = input.attachments || []
  // Project files are always generated by DeepSeek. Gemini is deliberately
  // limited to understanding attached images/files below so text-only builds
  // never consume Gemini quota or wait on a Gemini fallback.
  const generationMode: CodegenMode = mode === "deepseek-pro" ? "deepseek-pro" : "deepseek-flash"
  const picked = pickModel(generationMode, false)

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
      "Use every attached screenshot/file to understand exact placement and responsive behavior.",
      "When adding premium animation/design, use the Premium Design Engine permissions from the system prompt but keep the edit targeted.",
      "Before returning files, verify that every internal slash navigation link has a matching app/**/page.tsx file in the existing tree or in this response."
    )
  } else {
    promptParts.push(
      "MODE: NEW PROJECT",
      "",
      "USER REQUEST:",
      input.prompt.trim(),
      "",
      "Emit a complete Next.js App Router project with app/page.tsx, app/layout.tsx, app/globals.css, and any required components.",
      "The project must run immediately without missing variables or providers.",
      "Use every attached screenshot/file as visual reference.",
      "When the request asks for premium animation/design, use the Premium Design Engine permissions from the system prompt.",
      "Before returning files, verify that every internal slash navigation link has a matching app/**/page.tsx file in this same response."
    )
  }

  let userPrompt = promptParts.join("\n")

  function buildContent(prompt: string): Array<TextPart | ImagePart | FilePart> {
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

  if (attachments.length > 0) {
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()
    if (!googleApiKey) {
      throw new Error("Gemini image analysis cannot start because its direct API key is missing.")
    }
    const google = createGoogleGenerativeAI({ apiKey: googleApiKey })
    const imageAnalysis = await generateText({
      model: google(BUILDER_MODELS["gemini-flash"].replace("google/", "")),
      system: "Analyse the attached reference images/files for a web application builder. Describe layout, hierarchy, colours, typography, visible content, components, interactions, spacing, responsive behaviour, and the exact requested change. Do not generate source code.",
      messages: [{ role: "user", content: buildContent(input.prompt.trim()) }],
      maxOutputTokens: 2_000,
      maxRetries: 1,
      abortSignal: input.abortSignal,
    })
    userPrompt = `${userPrompt}\n\nGEMINI IMAGE/FILE ANALYSIS:\n${imageAnalysis.text.trim()}\n\nUse this analysis as visual context. DeepSeek must generate all project source files.`
  }

  async function run(modelName: string, structuredRetry = false, forceGateway = false) {
    const prompt = `${structuredRetry ? `${userPrompt}${STRUCTURED_RETRY_PROMPT}` : userPrompt}${DEEPSEEK_JSON_PROMPT}`
    const directDeepSeekKey = process.env.DEEPSEEK_API_KEY?.trim()
    if (!forceGateway && modelName.startsWith("deepseek/") && directDeepSeekKey) {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${directDeepSeekKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: structuredRetry ? `${SYSTEM_PROMPT}${STRUCTURED_RETRY_PROMPT}` : SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: structuredRetry ? 0.05 : 0.18,
          max_tokens: Math.min(input.maxOutputTokens ?? maxOutputTokensForPlan(input.userPlan), 8_192),
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
      const content = choice?.message?.content || ""
      if (choice?.finish_reason === "length") {
        throw new Error("DeepSeek JSON response was truncated before all project files were returned.")
      }
      return {
        object: parseDeepSeekProject(content),
        usage: {
          inputTokens: payload.usage?.prompt_tokens || 0,
          outputTokens: payload.usage?.completion_tokens || 0,
          totalTokens: payload.usage?.total_tokens || 0,
        },
      }
    }
    const model = providerModel(modelName, forceGateway)
    const request = {
      model,
      schema: ProjectSchema,
      system: structuredRetry ? `${SYSTEM_PROMPT}${STRUCTURED_RETRY_PROMPT}` : SYSTEM_PROMPT,
      temperature: structuredRetry ? 0.05 : 0.18,
      maxOutputTokens: input.maxOutputTokens ?? maxOutputTokensForPlan(input.userPlan),
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
    }

    return generateObject({ ...request, prompt })
  }

  let usedModel = picked.model
  let usedReason = picked.reason
  let result

  try {
    result = await run(picked.model)
  } catch (firstError) {
    if (isStructuredOutputError(firstError)) {
      usedReason = `${picked.reason} The first DeepSeek structured response could not be parsed, so DeepSeek retried once with stricter output rules.`
      result = await run(usedModel, true)
    } else {
      const geminiFallbackConfigured = Boolean(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
        process.env.GEMINI_API_KEY?.trim() ||
        gatewayConfigured(),
      )
      if (!geminiFallbackConfigured) throw firstError

      usedModel = BUILDER_MODELS["gemini-flash"]
      usedReason = `${picked.reason} DeepSeek was unavailable, so generation continued automatically with Gemini Flash.`
      try {
        result = await run(usedModel)
      } catch (geminiError) {
        if (!isStructuredOutputError(geminiError)) throw geminiError
        usedReason = `${usedReason} The first Gemini response could not be parsed, so Gemini retried once with stricter output rules.`
        result = await run(usedModel, true)
      }
    }
  }

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
    model: usedModel,
    reason: usedReason,
    usage: normalizeGenerationUsage(result.usage, usedModel),
  }
}
