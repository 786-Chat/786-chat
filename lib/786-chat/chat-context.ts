const MAX_CONTEXT_FILES = 6
const MAX_CONTEXT_CHARS = 18_000
const MAX_FILE_CHARS = 5_000
const MAX_RECENT_MESSAGES = 8
const MAX_MESSAGE_CHARS = 1_000

const STOP_WORDS = new Set([
  "a", "about", "an", "and", "are", "can", "could", "do", "does", "for", "from", "help",
  "how", "i", "in", "is", "it", "me", "my", "of", "on", "please", "question", "tell", "that",
  "the", "this", "to", "what", "when", "where", "which", "why", "with", "you", "your",
])

const LOW_VALUE_FILE = /(?:^|\/)(?:node_modules|\.next|dist|build)(?:\/|$)|(?:package-lock|pnpm-lock|yarn\.lock)|\.(?:png|jpe?g|gif|webp|ico|woff2?|ttf|map)$/i

function tokens(value: string) {
  return Array.from(new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9/_-]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  )).slice(0, 24)
}

function fileScore(questionTokens: string[], path: string, content: string) {
  const pathText = path.toLowerCase()
  const contentText = content.toLowerCase().slice(0, 24_000)
  let score = 0
  for (const token of questionTokens) {
    if (pathText.includes(token)) score += 14
    const occurrences = contentText.split(token).length - 1
    score += Math.min(occurrences, 8)
  }
  if (/\/page\.(?:tsx?|jsx?)$/i.test(path)) score += 2
  if (/^(?:components|lib|docs)\//i.test(path)) score += 1
  return score
}

export function selectRelevantProjectFiles(
  question: string,
  files: Record<string, string>,
  maxFiles = MAX_CONTEXT_FILES,
) {
  const questionTokens = tokens(question)
  const candidates = Object.entries(files)
    .filter(([path, content]) => !LOW_VALUE_FILE.test(path) && typeof content === "string" && content.trim())
    .map(([path, content]) => ({ path, content, score: fileScore(questionTokens, path, content) }))
    .sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))

  const positive = candidates.filter((item) => item.score > 0)
  const selected = (positive.length ? positive : candidates.filter((item) => /\/page\.(?:tsx?|jsx?)$/i.test(item.path)))
    .slice(0, Math.max(1, maxFiles))

  let remaining = MAX_CONTEXT_CHARS
  return selected.flatMap(({ path, content, score }) => {
    if (remaining <= 0) return []
    const excerpt = content.slice(0, Math.min(MAX_FILE_CHARS, remaining))
    remaining -= excerpt.length
    return [{ path, excerpt, score }]
  })
}

type ChatMessage = {
  role?: string | null
  content?: string | null
}

export function recentProjectConversation(messages: ChatMessage[] | undefined) {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((message) => typeof message.content === "string" && message.content.trim())
    .slice(-MAX_RECENT_MESSAGES)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content).trim().slice(0, MAX_MESSAGE_CHARS),
    }))
}

export function projectQuestionContext(input: {
  question: string
  title?: string | null
  description?: string | null
  files?: Record<string, string> | null
  messages?: ChatMessage[] | null
}) {
  const files = input.files || {}
  const selectedFiles = selectRelevantProjectFiles(input.question, files)
  const recentMessages = recentProjectConversation(input.messages || undefined)

  const sections = [
    input.title ? `Open project: ${input.title}` : "",
    input.description ? `Project description: ${input.description}` : "",
    selectedFiles.length
      ? [
          "Relevant project source excerpts:",
          ...selectedFiles.map((file) => `\n--- ${file.path} ---\n${file.excerpt}`),
        ].join("\n")
      : "",
    recentMessages.length
      ? [
          "Recent project conversation:",
          ...recentMessages.map((message) => `${message.role}: ${message.content}`),
        ].join("\n")
      : "",
  ].filter(Boolean)

  return {
    text: sections.join("\n\n"),
    selectedPaths: selectedFiles.map((file) => file.path),
  }
}
