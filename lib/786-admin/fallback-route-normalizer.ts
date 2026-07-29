const PAGE_SECTION = /^(?:pages?|routes?|screens?|create|generate|build|include)\s*:?\s*$/i
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

export function requestedFallbackRoutes(prompt: string) {
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

  return Array.from(new Set(["/", ...explicitRoutes, ...namedRoutes])).slice(0, 16)
}

export function normalizeFallbackPromptRoutes(prompt: string) {
  const routes = requestedFallbackRoutes(prompt)
  if (routes.length <= 1) return prompt

  const routeBlock = routes.map((route) => `- ${route}`).join("\n")
  return `${prompt.trim()}\n\nFALLBACK ROUTES:\n${routeBlock}`
}

function routeLabel(route: string) {
  if (route === "/") return "Home"
  return route
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(" · ")
}

export function repairFallbackRouteFiles(files: Record<string, string>, prompt: string) {
  const routes = requestedFallbackRoutes(prompt)
  if (routes.length <= 1) return files

  const repaired = { ...files }
  const home = repaired["app/page.tsx"]
  if (!home) return repaired

  const navigation = routes.map((route) => `<a href="${route}">${routeLabel(route)}</a>`).join("")

  for (const [path, source] of Object.entries(repaired)) {
    if (!/^app\/(?:.+\/)?page\.tsx$/.test(path)) continue
    repaired[path] = source.replace(/<nav>[\s\S]*?<\/nav>/, `<nav>${navigation}</nav>`)
  }

  for (const route of routes) {
    if (route === "/") continue
    const path = `app/${route.replace(/^\//, "")}/page.tsx`
    if (repaired[path]) continue

    const label = routeLabel(route)
    repaired[path] = home
      .replace(/<nav>[\s\S]*?<\/nav>/, `<nav>${navigation}</nav>`)
      .replace(/<p className="eyebrow">[\s\S]*?<\/p>/, `<p className="eyebrow">${label}</p>`)
      .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${label}</h1>`)
      .replace(/<p className="lead">[\s\S]*?<\/p>/, `<p className="lead">Explore ${label.toLowerCase()} information and services.</p>`)
  }

  return repaired
}
