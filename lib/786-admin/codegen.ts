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

function pickModel(mode: CodegenMode, hasAttachments: boolean): {
  provider: "deepseek" | "gemini"
  model: string
  reason: string
} {
  if (hasAttachments) {
    if (mode === "gemini-flash") {
      return { provider: "gemini", model: "gemini-2.5-flash", reason: "Gemini Flash selected for image/file analysis." }
    }
    return { provider: "gemini", model: "gemini-2.5-pro", reason: "Gemini Pro selected because one or more images/files were attached." }
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

${ROUTE_INTEGRITY_PROMPT}
${PREMIUM_DESIGN_ENGINE_PROMPT}`

const STRUCTURED_RETRY_PROMPT = `

STRUCTURED OUTPUT RETRY:
Your previous response could not be parsed into the required project object.
Return exactly one schema-valid project object and nothing outside it.
Keep title, description, and reply concise.
Return complete file contents, but reduce duplication by using a small number of reusable shared components.
Do not use markdown fences, prose before the object, prose after the object, comments outside file contents, or partial files.
Ensure every file entry has a non-empty path and complete string content.
`

function errorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  return String(error)
}

function isQuotaError(error: unknown): boolean {
  return /quota|rate.?limit|resource exhausted|429|exceeded your current quota/i.test(errorMessage(error))
}

function isStructuredOutputError(error: unknown): boolean {
  return /no object generated|could not parse|failed to parse|parse error|invalid json|schema validation|did not match the schema|noobjectgenerated/i.test(errorMessage(error))
}

export async function generateProjectCode(input: CodegenInput): Promise<CodegenResult> {
  const mode: CodegenMode = input.mode ?? "auto"
  const attachments = input.attachments || []
  const picked = pickModel(mode, attachments.length > 0)

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

  const userPrompt = promptParts.join("\n")

  function buildContent(prompt: string): unknown[] {
    const content: unknown[] = [{ type: "text", text: prompt }]
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

  async function run(modelName: string, structuredRetry = false) {
    const model = picked.provider === "deepseek" ? deepseek(modelName) : google(modelName)
    const prompt = structuredRetry ? `${userPrompt}${STRUCTURED_RETRY_PROMPT}` : userPrompt
    const request: Parameters<typeof generateObject>[0] = {
      model,
      schema: ProjectSchema,
      system: structuredRetry ? `${SYSTEM_PROMPT}${STRUCTURED_RETRY_PROMPT}` : SYSTEM_PROMPT,
      temperature: structuredRetry ? 0.05 : 0.18,
      prompt,
    }

    if (attachments.length > 0) {
      delete (request as { prompt?: string }).prompt
      ;(request as unknown as { messages: unknown[] }).messages = [
        { role: "user", content: buildContent(prompt) },
      ]
    }

    return generateObject(request)
  }

  let usedModel = picked.model
  let usedReason = picked.reason
  let result

  try {
    result = await run(picked.model)
  } catch (firstError) {
    const canRetryWithFlash =
      attachments.length > 0 &&
      picked.provider === "gemini" &&
      picked.model !== "gemini-2.5-flash" &&
      isQuotaError(firstError)

    if (canRetryWithFlash) {
      usedModel = "gemini-2.5-flash"
      usedReason = `${picked.reason} Gemini Pro quota was unavailable, so the request retried with Gemini Flash.`
      try {
        result = await run(usedModel)
      } catch (flashError) {
        if (!isStructuredOutputError(flashError)) throw flashError
        usedReason = `${usedReason} The first structured response could not be parsed, so generation retried once with stricter output rules.`
        result = await run(usedModel, true)
      }
    } else {
      if (!isStructuredOutputError(firstError)) throw firstError
      usedReason = `${picked.reason} The first structured response could not be parsed, so generation retried once with stricter output rules.`
      result = await run(usedModel, true)
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
  }
}
