import type { ProjectSpecification } from "./specification"

export type ProjectValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function routeFileCandidates(route: string) {
  const suffix = route === "/" ? "page" : `${route.slice(1)}/page`
  return [
    `app/${suffix}.tsx`,
    `app/${suffix}.ts`,
    `app/${suffix}.jsx`,
    `app/${suffix}.js`,
    `src/app/${suffix}.tsx`,
    `src/app/${suffix}.ts`,
    `src/app/${suffix}.jsx`,
    `src/app/${suffix}.js`,
  ]
}

function source(files: Record<string, string>) {
  return Object.entries(files)
    .filter(([path]) => /\.(?:tsx?|jsx?|css)$/.test(path))
    .map(([path, content]) => `/* ${path} */\n${content}`)
    .join("\n")
}

function internalHrefRoutes(files: Record<string, string>) {
  const routes = new Set<string>()
  for (const [path, content] of Object.entries(files)) {
    if (!/\.(?:tsx?|jsx?)$/.test(path)) continue
    for (const match of content.matchAll(/\bhref\s*=\s*(?:\{\s*)?["'`]([^"'`]+)["'`](?:\s*\})?/gi)) {
      const href = match[1].trim()
      if (!href.startsWith("/") || href.startsWith("//")) continue
      const route = href.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/"
      if (/\.[a-z0-9]{2,8}$/i.test(route)) continue
      routes.add(route)
    }
  }
  return routes
}

export function validateGeneratedProject(
  specification: ProjectSpecification,
  files: Record<string, string>,
): ProjectValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const combined = source(files)

  for (const route of specification.routes) {
    if (!routeFileCandidates(route).some((path) => typeof files[path] === "string" && files[path].trim())) {
      errors.push(`Missing requested route: ${route}`)
    }
  }

  for (const route of internalHrefRoutes(files)) {
    if (!routeFileCandidates(route).some((path) => typeof files[path] === "string" && files[path].trim())) {
      errors.push(`Internal navigation points to missing route: ${route}`)
    }
  }

  const requirements: Record<string, RegExp> = {
    "email-input": /type\s*=\s*["']email["']|name\s*=\s*["']email["']/i,
    "password-input": /type\s*=\s*(?:["']password["']|\{[^}]*["']password["'][^}]*\})|name\s*=\s*["']password["']/i,
    "remember-me": /remember[\s_-]*me/i,
    "forgot-password-link": /forgot[\s_-]*(?:your[\s_-]*)?password/i,
    "submit-button": /<button[^>]*type\s*=\s*["']submit["']|<button[^>]*>[^<]*(?:sign in|log in|submit)/i,
  }

  for (const component of specification.requiredComponents) {
    const pattern = requirements[component]
    if (pattern && !pattern.test(combined)) errors.push(`Missing required control: ${component}`)
  }

  if (/AI Generated Project|Top-tier digital craftsmanship|Enter the experience|Everything feels custom-built/i.test(combined)) {
    errors.push("Generic fallback content was detected.")
  }
  if (Object.keys(files).length < 3) warnings.push("The project contains very few files.")

  return { valid: errors.length === 0, errors, warnings }
}
