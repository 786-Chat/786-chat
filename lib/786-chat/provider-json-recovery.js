// Recover only predictable presentation mistakes in structured AI responses.
// This module never invents source-file content or accepts partial JSON.
export function escapeRawJsonControlCharacters(input) {
  let quoted = false
  let escaped = false
  let output = ""
  for (const character of input) {
    if (escaped) {
      output += character
      escaped = false
      continue
    }
    if (character === "\\\"".slice(1)) {
      // Quote toggles only outside an escaped sequence.
      quoted = !quoted
      output += character
      continue
    }
    if (character === "\\") {
      if (quoted) escaped = true
      output += character
      continue
    }
    const code = character.charCodeAt(0)
    if (quoted && code < 32) {
      if (character === "\n") output += "\\n"
      else if (character === "\r") output += "\\r"
      else if (character === "\t") output += "\\t"
      else output += "\\u" + code.toString(16).padStart(4, "0")
    } else {
      output += character
    }
  }
  return output
}

export function parseProviderJson(text) {
  // Permit one complete JSON code fence, never arbitrary prose or partial files.
  const source = text.trim()
  const fenced = /^\`\`\`(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n\`\`\`[ \t]*$/i.exec(source)
  const json = fenced ? fenced[1].trim() : source
  try {
    return JSON.parse(json)
  } catch {
    return JSON.parse(escapeRawJsonControlCharacters(json))
  }
}

export function normalizeExistingProjectJson(value, existing) {
  if (!existing || !value || typeof value !== "object" || Array.isArray(value)) return value
  const source = value.project && typeof value.project === "object" && !Array.isArray(value.project)
    ? value.project
    : value
  const files = source.files && typeof source.files === "object" && !Array.isArray(source.files)
    ? Object.entries(source.files).map(([path, content]) => ({ path, content }))
    : source.files
  return {
    ...source,
    title: typeof source.title === "string" && source.title.trim() ? source.title : existing.title,
    description: typeof source.description === "string" && source.description.trim() ? source.description : (existing.description || "Updated existing project"),
    reply: typeof source.reply === "string" && source.reply.trim() ? source.reply : "Existing project updated.",
    files,
  }
}
