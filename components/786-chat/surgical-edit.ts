import type { GenerationRequest, GenerationResult } from "./contracts"

type TextReplacement = {
  before: string
  after: string
}

function parseQuotedReplacement(message: string): TextReplacement | null {
  const normalized = message
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim()

  const match = normalized.match(
    /\b(?:change|replace|rename|update)\s+(?:the\s+)?(["'])(.{1,160}?)\1(?:\s+(?:button|text|label|copy|wording|title|heading|link))?\s+(?:to|with)\s+(["'])(.{1,160}?)\3/i,
  )

  if (!match?.[2] || !match?.[4]) return null
  const before = match[2].trim()
  const after = match[4].trim()
  if (!before || !after || before === after) return null
  return { before, after }
}

function occurrenceCount(content: string, value: string) {
  if (!value) return 0
  return content.split(value).length - 1
}

export function trySurgicalTextEdit(request: GenerationRequest): GenerationResult | null {
  if (!request.existing || !request.projectId || request.attachments.length) return null

  const replacement = parseQuotedReplacement(request.message)
  if (!replacement) return null

  const sourceEntries = Object.entries(request.existing.keyFiles).filter(([path]) =>
    /\.(?:[cm]?[jt]sx?|html?|mdx?)$/i.test(path),
  )

  let matchedPath = ""
  let totalMatches = 0
  for (const [path, content] of sourceEntries) {
    const count = occurrenceCount(content, replacement.before)
    if (count > 0) matchedPath = path
    totalMatches += count
    if (totalMatches > 1) return null
  }

  // Only perform a deterministic edit when the user's quoted source text maps
  // to exactly one place. Ambiguous requests still go through the AI editor.
  if (totalMatches !== 1 || !matchedPath) return null

  const files = { ...request.existing.keyFiles }
  files[matchedPath] = files[matchedPath].replace(replacement.before, replacement.after)

  return {
    response: `Changed “${replacement.before}” to “${replacement.after}” and preserved every other project file.`,
    model: "surgical-edit",
    reason: `Exact one-match text replacement applied in ${matchedPath}; no AI regeneration was required.`,
    providerAttempts: [],
    providerFailoverUsed: false,
    project: {
      title: request.existing.title,
      description: request.existing.description,
      files,
    },
  }
}
