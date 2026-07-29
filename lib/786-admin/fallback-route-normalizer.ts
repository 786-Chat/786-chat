const PAGE_SECTION = /^(?:pages?|routes?|screens?|create|generate|build|include)\s*:?[\s]*$/i
const STOP_SECTION = /^(?:do not|don't|never|avoid|exclude|forbidden|use|design|colou?r|typography|layout|features?|modules?|sections?)\b/i

function slugifyPageName(value: string) {
  const cleaned = value
    .replace(/^[-•*]\s+/, "")
    .replace(/[.;:]+$/, "")
    .replace(/\bpage$/i, "")
    .trim()

  if (!cleaned || cleaned.length > 60) return null
  if (/^(?:home|homepage|landing page)$/i.test(cleaned)) return "/"
  if (/^(?:and|or|with|without)$/i.test(cleaned)) return null

  const slug = cleaned
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

  return slug ? `/${slug}` : null
}

export function normalizeFallbackPromptRoutes(prompt: string) {
  const explicitRoutes = Array.from(prompt.matchAll(/^\s*[-•*]\s*(\/[a-z0-9/_-]*)\s*$/gim), (match) => match[1])
  const namedRoutes: string[] = []
  let acceptingPages = false

  for (const raw of prompt.split(/\n+/)) {
    const line = raw.trim()
    if (!line) continue

    if (PAGE_SECTION.test(line)) {
      acceptingPages = true
      continue
    }

    if (STOP_SECTION.test(line)) {
      acceptingPages = false
      continue
    }

    if (!acceptingPages || !/^[-•*]\s+/.test(line)) continue
    const route = slugifyPageName(line)
    if (route) namedRoutes.push(route)
  }

  const routes = Array.from(new Set(["/", ...explicitRoutes, ...namedRoutes])).slice(0, 16)
  if (routes.length <= 1) return prompt

  const routeBlock = routes.map((route) => `- ${route}`).join("\n")
  return `${prompt.trim()}\n\nFALLBACK ROUTES:\n${routeBlock}`
}
