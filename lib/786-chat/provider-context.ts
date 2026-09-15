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

function safeExcerpt(content: string) {
  return content.replace(DATA_URL, "[data-url omitted]").replace(BASE64_BLOB, "[large encoded payload omitted]").slice(0, MAX_PROVIDER_FILE_CHARS)
}

export function boundedExistingProjectContext(prompt: string, files: Record<string, string>) {
  const tokens = promptTokens(prompt)
  const ranked = Object.entries(files)
    .filter(([path, content]) => !LOW_VALUE_PATH.test(path) && typeof content === "string" && content.trim())
    .map(([path, content]) => {
      const lowerPath = path.toLowerCase()
      const sample = content.toLowerCase().slice(0, 20_000)
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
    const excerpt = safeExcerpt(item.content).slice(0, remaining)
    if (!excerpt) continue
    bounded[item.path] = excerpt
    remaining -= excerpt.length
  }
  return bounded
}
