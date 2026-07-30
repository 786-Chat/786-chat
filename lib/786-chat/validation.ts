import type { ProjectSpecification } from "./specification"

export type ProjectValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const LUCIDE_COMPATIBILITY_ALIASES: Record<string, string> = {
  Tooth: "Smile",
  Ambulance: "HeartPulse",
}

export function normalizeGeneratedImports(files: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(files).map(([path, content]) => {
      if (!/\.(?:tsx?|jsx?)$/.test(path) || !/from\s+["']lucide-react["']/.test(content)) {
        return [path, content]
      }
      const normalized = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/g,
        (statement, names: string) => {
          let normalizedNames = names
          for (const [unsupported, supported] of Object.entries(LUCIDE_COMPATIBILITY_ALIASES)) {
            normalizedNames = normalizedNames.replace(
              new RegExp(`\\b${unsupported}\\b(?!\\s+as\\b)`, "g"),
              `${supported} as ${unsupported}`,
            )
          }
          return statement.replace(names, normalizedNames)
        },
      )
      return [path, normalized]
    }),
  )
}

export function normalizeGeneratedAuthLinks(
  specification: ProjectSpecification,
  files: Record<string, string>,
) {
  if (!specification.routes.includes("/login")) return files

  const replacements: Record<string, string> = {
    "/forgot-password": "/login?mode=forgot-password",
    "/register": "/login?mode=register",
    "/signup": "/login?mode=register",
    "/sign-up": "/login?mode=register",
  }

  return Object.fromEntries(
    Object.entries(files).map(([path, content]) => {
      if (!/\.(?:tsx?|jsx?)$/.test(path)) return [path, content]
      const normalized = content
        .replace(
          /(\bhref\s*=\s*(?:\{\s*)?)(["'`])(\/(?:forgot-password|register|signup|sign-up))\2((?:\s*\})?)/gi,
          (_match, prefix: string, quote: string, route: string, suffix: string) =>
            `${prefix}${quote}${replacements[route.toLowerCase()]}${quote}${suffix}`,
        )
        .replace(
          /(\b(?:href|to)\s*:\s*)(["'`])(\/(?:forgot-password|register|signup|sign-up))\2/gi,
          (_match, prefix: string, quote: string, route: string) =>
            `${prefix}${quote}${replacements[route.toLowerCase()]}${quote}`,
        )
      return [path, normalized]
    }),
  )
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
    const routePatterns = [
      /\bhref\s*=\s*(?:\{\s*)?["'`]([^"'`]+)["'`](?:\s*\})?/gi,
      /\b(?:href|to)\s*:\s*["'`]([^"'`]+)["'`]/gi,
      /\b(?:router\.)?(?:push|replace)\(\s*["'`]([^"'`]+)["'`]/gi,
    ]
    for (const pattern of routePatterns) {
      for (const match of content.matchAll(pattern)) {
        const href = match[1].trim()
        if (!href.startsWith("/") || href.startsWith("//")) continue
        const route = href.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/"
        if (/\.[a-z0-9]{2,8}$/i.test(route)) continue
        routes.add(route)
      }
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

  if (specification.systemBlueprint) {
    const requiredSystemFiles = [
      "shared/contracts.ts",
      "lib/server/tenant.ts",
      "lib/server/validation.ts",
      "sql/schema.sql",
      ...specification.systemBlueprint.apiResources.map((resource) =>
        `app/api/${resource}/route.ts`
      ),
    ]
    for (const path of requiredSystemFiles) {
      if (typeof files[path] !== "string" || !files[path].trim()) {
        errors.push(`Missing required system file: ${path}`)
      }
    }
    const schema = files["sql/schema.sql"] || ""
    const tenantGuard = files["lib/server/tenant.ts"] || ""
    if (specification.systemBlueprint.tenantScoped) {
      if (!/\bcompany_id\b/i.test(schema)) {
        errors.push("Tenant-scoped schema is missing company_id.")
      }
      if (!/company[_A-Z]?id|company_id/i.test(tenantGuard) ||
          !/unauthor|forbidden|access|permission|role/i.test(tenantGuard)) {
        errors.push("Server tenant guard does not enforce company ownership.")
      }
    }
    if (!/CREATE\s+TABLE/i.test(schema) || !/audit/i.test(schema)) {
      errors.push("Operational PostgreSQL schema or audit storage is incomplete.")
    }
    for (const resource of specification.systemBlueprint.apiResources) {
      const api = files[`app/api/${resource}/route.ts`] || ""
      if (!/export\s+async\s+function\s+(?:GET|POST|PATCH|DELETE)/.test(api)) {
        errors.push(`System API is not implemented: ${resource}`)
      }
    }
  }

  if (/AI Generated Project|Top-tier digital craftsmanship|Enter the experience|Everything feels custom-built/i.test(combined)) {
    errors.push("Generic fallback content was detected.")
  }
  if (Object.keys(files).length < 3) warnings.push("The project contains very few files.")

  return { valid: errors.length === 0, errors, warnings }
}
