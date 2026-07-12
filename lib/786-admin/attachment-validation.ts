import type { CodegenAttachment } from "@/lib/786-admin/codegen"

const MAX_ATTACHMENTS = 4
const MAX_ATTACHMENT_DATA_URL_LENGTH = 14_000_000
const MAX_ATTACHMENT_NAME_LENGTH = 200
const ALLOWED_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
])

function parseOneAttachment(value: unknown): CodegenAttachment | undefined {
  if (!value || typeof value !== "object") return undefined

  const raw = value as Record<string, unknown>
  const url = typeof raw.url === "string" ? raw.url.trim() : ""
  const mediaType = typeof raw.mediaType === "string" ? raw.mediaType.trim().toLowerCase() : ""
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, MAX_ATTACHMENT_NAME_LENGTH) : undefined

  if (!url || !mediaType) return undefined
  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    throw new Error("Only PNG, JPEG, WebP, GIF, and PDF attachments are supported.")
  }
  if (!url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("data:")) {
    throw new Error("Attachment URL is invalid.")
  }
  if (url.startsWith("data:") && url.length > MAX_ATTACHMENT_DATA_URL_LENGTH) {
    throw new Error("Attachment is too large.")
  }

  return { url, mediaType, name }
}

export function parseAttachments(body: Record<string, unknown>): CodegenAttachment[] {
  const rawAttachments = Array.isArray(body.attachments)
    ? body.attachments
    : body.attachment
      ? [body.attachment]
      : []

  if (rawAttachments.length > MAX_ATTACHMENTS) {
    throw new Error(`A maximum of ${MAX_ATTACHMENTS} attachments is allowed.`)
  }

  return rawAttachments
    .map(parseOneAttachment)
    .filter((attachment): attachment is CodegenAttachment => Boolean(attachment))
}
