const MAX_PROVIDER_CONTEXT_FILES = 10
const MAX_PROVIDER_CONTEXT_CHARS = 48_000
const MAX_PROVIDER_FILE_CHARS = 8_000

const LOW_VALUE_PATH = /(?:^|\/)(?:node_modules|\.next|dist|build|coverage)(?:\/|$)|(?:package-lock|pnpm-lock|yarn\.lock)|\.(?:png|jpe?g|gif|webp|ico|woff2?|ttf|otf|map|zip|pdf)$/i
const DATA_URL = /data:[^;\s]+;base64,[A-Za-z0-9+/=]{256,}/gi
const BASE64_BLOB = /[A-Za-z0-9+/]{4096,}={0,2}/g
const STOP_WORDS = new Set(["the","and","for","with","this","that","from","into","please","change","edit","fix","add","remove","project","page","app"])

function promptTokens(prompt: string) {
  return Array.from(new Set(prompt.toLowerCase().replace(/[^a-z0-9/_-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3 && !STOP_WORDS.has(token)))).slice(0, 32)
}

function safeExcerpt(content: string, tokens: string[]) {
  const safe = content
    .replace(DATA_URL, "[data-url omitted]")
    .replace(BASE64_BLOB, "[large encoded payload omitted]")
  if (safe.length <= MAX_PROVIDER_FILE_CHARS) return safe

  const lower = safe.toLowerCase()
  const candidates: Array<{ start: number; score: number }> = []
  for (const token of tokens) {
    let from = 0
    let matches = 0
    while (matches < 8) {
      const index = lower.indexOf(token, from)
      if (index < 0) break
      const start = Math.max(0, index - 2_800)
      const window = lower.slice(start, start + 6_400)
      const score = tokens.reduce((total, item) => total + (window.includes(item) ? 1 : 0), 0)
      candidates.push({ start, score })
      from = index + Math.max(token.length, 1)
      matches += 1
    }
  }

  if (!candidates.length) return safe.slice(0, MAX_PROVIDER_FILE_CHARS)
  candidates.sort((a, b) => b.score - a.score || a.start - b.start)
  const best = candidates[0]
  const headBudget = 1_200
  if (best.start < headBudget) return safe.slice(0, MAX_PROVIDER_FILE_CHARS)

  const marker = "\n/* ... 786.Chat relevant excerpt from later in this same file ... */\n"
  const windowBudget = MAX_PROVIDER_FILE_CHARS - headBudget - marker.length
  return safe.slice(0, headBudget) + marker + safe.slice(best.start, best.start + windowBudget)
}

export function boundedExistingProjectContext(prompt: string, files: Record<string, string>) {
  const tokens = promptTokens(prompt)
  const ranked = Object.entries(files)
    .filter(([path, content]) => !LOW_VALUE_PATH.test(path) && typeof content === "string" && content.trim())
    .map(([path, content]) => {
      const lowerPath = path.toLowerCase()
      const sample = content.toLowerCase()
      let score = /^(?:package\.json|app\/layout\.tsx|app\/page\.tsx|lib\/server\/)/i.test(path) ? 2 : 0
      for (const token of tokens) {
        if (lowerPath.includes(token)) score += 20
        if (sample.includes(token)) score += 2
      }
      return { path, content, score }
    })
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))

  const selected = ranked.filter((item) => item.score > 0)
  const candidates = (selected.length ? selected : ranked).slice(0, MAX_PROVIDER_CONTEXT_FILES)
  let remaining = MAX_PROVIDER_CONTEXT_CHARS
  const bounded: Record<string, string> = {}
  for (const item of candidates) {
    if (remaining <= 0) break
    const excerpt = safeExcerpt(item.content, tokens).slice(0, remaining)
    if (!excerpt) continue
    bounded[item.path] = excerpt
    remaining -= excerpt.length
  }
  return bounded
}
