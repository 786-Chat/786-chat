import { gunzipSync } from "node:zlib"

export const IMPORT_BUNDLE_PATH = ".786-chat-import.bundle.json.gz.b64"

function isSafeRelativePath(value: string): boolean {
  if (!value || value.startsWith("/") || value.startsWith("\\")) return false
  const normalized = value.replace(/\\/g, "/")
  if (normalized.includes("\u0000")) return false
  const segments = normalized.split("/")
  return !segments.some((segment) => segment === "..")
}

export function expandImportedFileBundle(content: string): Record<string, string> {
  const encoded = content.trim()
  if (!encoded) throw new Error("Imported source bundle is empty")

  let parsed: unknown
  try {
    const compressed = Buffer.from(encoded, "base64")
    const json = gunzipSync(compressed).toString("utf8")
    parsed = JSON.parse(json)
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown decode error"
    throw new Error(`Imported source bundle could not be decoded: ${detail}`)
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Imported source bundle must contain a JSON file map")
  }

  const files: Record<string, string> = {}
  for (const [path, fileContent] of Object.entries(parsed as Record<string, unknown>)) {
    if (!isSafeRelativePath(path)) {
      throw new Error(`Imported source bundle contains an unsafe path: ${path}`)
    }
    if (typeof fileContent !== "string") {
      throw new Error(`Imported source bundle contains non-text content at: ${path}`)
    }
    files[path.replace(/\\/g, "/")] = fileContent
  }

  return files
}
