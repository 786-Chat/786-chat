import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"

// Experimental owner-only adapters for DeepSeek's published application APIs.
// Disabled by default: enabling this endpoint can incur third-party charges.
export const runtime = "nodejs"
export const maxDuration = 120

const DEEPSEEK_BASE = "https://api.deepseek.com"
const MAX_TEXT_BYTES = 32_768
const MAX_FILE_BYTES = 12 * 1024 * 1024

type JsonObject = Record<string, unknown>

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } })
}

function getKey() {
  return process.env.DEEPSEEK_API_KEY?.trim() || ""
}

function enabled() {
  return process.env.DEEPSEEK_SUITE_ENABLED === "true"
}

function apiHeaders(key: string): HeadersInit {
  return { Authorization: `Bearer ${key}` }
}

async function forward(
  path: string,
  key: string,
  body: unknown,
  contentType: "json" | "form" = "json",
  timeoutMs = 60_000,
): Promise<Response> {
  const headers = new Headers(apiHeaders(key))
  if (contentType === "json") headers.set("Content-Type", "application/json")
  return fetch(`${DEEPSEEK_BASE}${path}`, {
    method: "POST",
    headers,
    body: contentType === "json" ? JSON.stringify(body) : body as FormData,
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  })
}

async function upstreamResult(response: Response) {
  if (!response.ok) return jsonError(`DeepSeek returned HTTP ${response.status}. No project files were changed.`, response.status >= 500 ? 502 : response.status)
  const value = await response.json().catch(() => null)
  if (!value || typeof value !== "object") return jsonError("DeepSeek returned an invalid response.", 502)
  return NextResponse.json(value, { headers: { "Cache-Control": "no-store" } })
}

function publicWebUrl(value: string) {
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.toLowerCase()
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return false
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false
    if (/^(?:127|10|0|169\.254|192\.168)\./.test(host)) return false
    if (/^172\.(?:1[6-9]|2[0-9]|3[01])\./.test(host)) return false
    if (host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return false
    return true
  } catch { return false }
}

function short(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function validFileId(value: string) {
  return /^file-[a-zA-Z0-9_-]{8,140}$/.test(value)
}

async function parseFile(request: Request, key: string) {
  const form = await request.formData()
  const action = short(form.get("action"), 30)
  const file = form.get("file")
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_BYTES) {
    return jsonError("Choose a file smaller than 12 MB.", 400)
  }
  if (!["asr", "ocr", "document-upload"].includes(action)) return jsonError("Invalid file action.", 400)
  if (action === "asr" && file.size > 8 * 1024 * 1024) return jsonError("Audio must be smaller than 8 MiB and shorter than 120 seconds.", 400)
  if (action === "asr" && !/\.(wav|ogg)$/i.test(file.name)) return jsonError("DeepSeek ASR requires WAV or Ogg Opus audio.", 400)
  const purpose = short(form.get("purpose"), 40)
  if (action !== "asr" && !["text_recognition", "rich_layout_recognition"].includes(purpose)) {
    return jsonError("Choose a supported document parsing purpose.", 400)
  }
  const toSend = new FormData()
  if (action !== "asr") toSend.set("purpose", purpose)
  toSend.set("file", file, file.name)

  const endpoint = action === "asr" ? "/v1/tools/asr" : action === "ocr" ? "/v1/tools/ocr" : "/files"
  const response = await forward(endpoint, key, toSend, "form", action === "asr" ? 90_000 : 110_000)
  return upstreamResult(response)
}

async function parseJson(request: Request, key: string) {
  const rawLength = Number(request.headers.get("content-length") || 0)
  if (rawLength > MAX_TEXT_BYTES) return jsonError("Request is too large.", 413)
  const body = await request.json().catch(() => null) as JsonObject | null
  if (!body || typeof body !== "object" || body.confirm !== true) {
    return jsonError("A confirmed action is required.", 400)
  }
  const action = short(body.action, 35)
  if (action === "search") {
    const query = short(body.query, 128)
    if (!query) return jsonError("Enter a search query.", 400)
    return upstreamResult(await forward("/v1/tools/search", key, { query, count: 5, need_content: false }))
  }
  if (action === "fetch") {
    const url = short(body.url, 8192)
    if (!publicWebUrl(url)) return jsonError("Enter a public HTTPS page URL (no private network addresses).", 400)
    return upstreamResult(await forward("/v1/tools/fetch", key, { url }))
  }
  if (action === "tts") {
    const text = short(body.text, 1500)
    const voice = body.voice === "tide" ? "tide" : "stella"
    if (!text) return jsonError("Enter text to speak.", 400)
    const response = await forward("/v1/tools/tts", key, { text, voice_id: voice, format: "wav", filter_markdown: true }, "json", 95_000)
    if (!response.ok) return jsonError(`DeepSeek speech generation returned HTTP ${response.status}.`, 502)
    const audio = await response.arrayBuffer()
    if (audio.byteLength === 0 || audio.byteLength > 20 * 1024 * 1024) return jsonError("DeepSeek returned invalid or oversized audio.", 502)
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": "attachment; filename=deepseek-voice.wav",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  }
  if (action === "chat" || action === "document-chat") {
    const message = short(body.message, 5000)
    const model = body.model === "deepseek-v4-pro" ? "deepseek-v4-pro" : "deepseek-flash"
    if (!message) return jsonError("Enter a question.", 400)
    let userContent: unknown = message
    if (action === "document-chat") {
      const fileId = short(body.fileId, 150)
      if (!validFileId(fileId)) return jsonError("Upload a DeepSeek document first.", 400)
      if (model !== "deepseek-flash") return jsonError("Document questions currently use DeepSeek Flash.", 400)
      userContent = [
        { type: "file", file_id: fileId },
        { type: "text", text: message },
      ]
    }
    const response = await forward("/chat/completions", key, {
      model,
      messages: [
        { role: "system", content: "Answer the user's question. This is read-only chat, not permission to create, modify or deploy any project." },
        { role: "user", content: userContent },
      ],
      max_tokens: 1200,
      stream: false,
    }, "json", 90_000)
    return upstreamResult(response)
  }
  return jsonError("Unknown DeepSeek action.", 400)
}

export async function GET() {
  const session = await getSession()
  if (!isAdminUser(session?.email)) return jsonError("Forbidden.", 403)
  return NextResponse.json({
    enabled: enabled() && Boolean(getKey()),
    availableActions: ["chat", "search", "fetch", "tts", "asr", "ocr", "document-upload", "document-chat"],
    paidActionsRequireConfirmation: true,
    note: "Preview integration. No calls occur unless an action is submitted; do not enable in production without budget monitoring.",
  }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!isAdminUser(session?.email)) return jsonError("Forbidden.", 403)
  if (!enabled()) return jsonError("DeepSeek Suite is disabled until the owner approves enabling paid API calls.", 423)
  const key = getKey()
  if (!key) return jsonError("DeepSeek API key is not configured on the server.", 503)
  try {
    const mediaType = request.headers.get("content-type") || ""
    if (mediaType.startsWith("multipart/form-data")) {
      const rawLength = Number(request.headers.get("content-length") || 0)
      if (rawLength > MAX_FILE_BYTES + 16384) return jsonError("File upload is too large.", 413)
      // File uploads are explicit user actions, never triggered automatically.
      const form = await request.clone().formData()
      if (form.get("confirm") !== "yes") return jsonError("Confirm the paid document or audio action first.", 400)
      return await parseFile(request, key)
    }
    if (!mediaType.includes("application/json")) return jsonError("Expected JSON or multipart data.", 415)
    return await parseJson(request, key)
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return jsonError("DeepSeek did not respond before the request timeout.", 504)
    }
    console.error("[786.Chat DeepSeek Suite] Request failed", error instanceof Error ? error.name : "unknown")
    return jsonError("DeepSeek operation failed. No 786.Chat project files were changed.", 502)
  }
}
