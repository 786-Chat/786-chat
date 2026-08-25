import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, type FilePart, type ImagePart, type TextPart } from "ai"

import { getSession } from "@/lib/auth"
import { normalizeGenerationUsage } from "@/lib/786-chat/ai-provider-config"

export const runtime = "nodejs"
export const maxDuration = 90

const VISION_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash"] as const

type VisionAttachment = {
  name?: string
  mediaType: string
  url: string
}

type VisionAttempt = {
  modelId: (typeof VISION_MODELS)[number]
  transport: "direct" | "gateway"
}

function gatewayConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim() ||
    process.env.VERCEL === "1",
  )
}

function attachmentContent(prompt: string, attachments: VisionAttachment[]): Array<TextPart | ImagePart | FilePart> {
  const content: Array<TextPart | ImagePart | FilePart> = [{
    type: "text",
    text: [
      "USER REQUEST:",
      prompt || "Describe the attached image clearly.",
      "",
      "Read the attachment only. Describe visible UI, text, layout, controls and any user-indicated target precisely.",
      "Do not generate code. Do not propose project files. Do not claim that you edited anything.",
    ].join("\n"),
  }]

  for (const attachment of attachments) {
    if (attachment.mediaType.startsWith("image/")) {
      content.push({
        type: "image",
        image: attachment.url,
        mediaType: attachment.mediaType,
      })
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

function safeError(error: unknown) {
  return String(error instanceof Error ? error.message : error || "Gemini vision failed.")
    .replace(/https?:\/\/\S+/gi, "provider documentation")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500)
}

function isQuotaError(reason: string) {
  return /quota|resource exhausted|rate.?limit|429|exceeded your current quota/i.test(reason)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const prompt = String(payload.message || "").trim()
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments.filter((attachment): attachment is VisionAttachment => {
        if (!attachment || typeof attachment !== "object") return false
        const value = attachment as Record<string, unknown>
        return typeof value.url === "string" && Boolean(value.url) && typeof value.mediaType === "string" && Boolean(value.mediaType)
      }).map((attachment) => ({
        name: typeof (attachment as Record<string, unknown>).name === "string" ? String((attachment as Record<string, unknown>).name) : undefined,
        mediaType: attachment.mediaType,
        url: attachment.url,
      }))
    : []

  if (!attachments.length) {
    return NextResponse.json({ success: false, error: "Attach an image before using image analysis." }, { status: 400 })
  }

  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()
  const useGateway = gatewayConfigured()
  if (!googleApiKey && !useGateway) {
    return NextResponse.json({ success: false, error: "Gemini image analysis is not configured." }, { status: 503 })
  }

  const directGoogle = googleApiKey ? createGoogleGenerativeAI({ apiKey: googleApiKey }) : null
  const attempts: VisionAttempt[] = []

  if (directGoogle) {
    for (const modelId of VISION_MODELS) attempts.push({ modelId, transport: "direct" })
  }
  if (useGateway) {
    for (const modelId of VISION_MODELS) attempts.push({ modelId, transport: "gateway" })
  }

  const failures: Array<{ model: string; transport: VisionAttempt["transport"]; reason: string; quota: boolean }> = []

  for (const attempt of attempts) {
    const modelName = `google/${attempt.modelId}`
    const model = attempt.transport === "direct"
      ? directGoogle!(attempt.modelId)
      : modelName

    try {
      const result = await generateText({
        model,
        system: "You are 786.Chat's vision reader. Your only job is to inspect attached images/files and return concise factual visual context for the user or for a separate coding agent. Never generate code and never modify project files.",
        messages: [{
          role: "user",
          content: attachmentContent(prompt, attachments),
        }],
        temperature: 0.1,
        maxOutputTokens: 1800,
        maxRetries: 0,
        ...(attempt.transport === "gateway"
          ? {
              providerOptions: {
                gateway: {
                  user: session.id || session.email,
                  tags: ["feature:builder-vision", `plan:${String(session.plan || "starter").toLowerCase()}`],
                  zeroDataRetention: true,
                },
              },
            }
          : {}),
      })

      const response = result.text?.trim()
      if (!response) throw new Error("Gemini returned no image analysis text.")

      return NextResponse.json({
        success: true,
        response,
        model: modelName,
        reason: `Gemini vision analysis completed with ${attempt.modelId} via ${attempt.transport === "gateway" ? "Vercel AI Gateway" : "direct Google API"}. No project files were generated or changed.`,
        usage: normalizeGenerationUsage(result.usage, modelName),
        visionFallbackUsed: attempts.indexOf(attempt) > 0,
        visionTransport: attempt.transport,
      })
    } catch (error) {
      const reason = safeError(error)
      failures.push({ model: attempt.modelId, transport: attempt.transport, reason, quota: isQuotaError(reason) })
      console.warn(`[786.Chat vision] ${attempt.transport}:${attempt.modelId} failed: ${reason}`)
    }
  }

  const quotaOnly = failures.length > 0 && failures.every((failure) => failure.quota)
  const lastReason = failures.at(-1)?.reason || "Gemini vision failed."

  return NextResponse.json({
    success: false,
    error: quotaOnly
      ? "Gemini image-reading quota is exhausted on both the direct Google connection and the available AI Gateway fallbacks. Your project was kept unchanged."
      : `Gemini could not read the attachment. ${lastReason}`,
    warning: quotaOnly ? "GEMINI_VISION_QUOTA_EXHAUSTED" : "GEMINI_VISION_FAILED",
    projectPreserved: true,
    visionAttempts: failures.map(({ model, transport, quota }) => ({
      model,
      transport,
      status: quota ? "quota_exhausted" : "failed",
    })),
  }, { status: 503 })
}
