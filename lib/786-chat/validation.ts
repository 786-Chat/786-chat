import type { ProjectSpecification } from "./specification"
import { assessGeneratedSystem } from "./system-acceptance"
import { assessDomainAcceptance } from "./domain-acceptance"
import { assessGeneratedBackend } from "./backend-capabilities"

export type ProjectValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const LUCIDE_COMPATIBILITY_ALIASES: Record<string, string> = {
  Tooth: "Smile",
  Ambulance: "HeartPulse",
}

function stripClientMetadataExport(content: string) {
  if (
    !/^\s*["']use client["'];?/m.test(content) ||
    !/\bexport\s+const\s+metadata\b/.test(content)
  ) {
    return content
  }

  const declaration = /\bexport\s+const\s+metadata(?:\s*:\s*Metadata)?\s*=\s*\{/.exec(content)
  if (!declaration) return content

  let cursor = declaration.index + declaration[0].length
  let depth = 1
  let quote: "'" | '"' | "`" | null = null
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (; cursor < content.length && depth > 0; cursor += 1) {
    const character = content[cursor]
    const next = content[cursor + 1]

    if (lineComment) {
      if (character === "\n") lineComment = false
      continue
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false
        cursor += 1
      }
      continue
    }
    if (quote) {
      if (escaped) {
        escaped = false
      } else if (character === "\\") {
        escaped = true
      } else if (character === quote) {
        quote = null
      }
      continue
    }
    if (character === "/" && next === "/") {
      lineComment = true
      cursor += 1
      continue
    }
    if (character === "/" && next === "*") {
      blockComment = true
      cursor += 1
      continue
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character
      continue
    }
    if (character === "{") depth += 1
    if (character === "}") depth -= 1
  }

  if (depth !== 0) return content

  const suffix = content.slice(cursor).match(/^\s*(?:as\s+const\s*)?(?:satisfies\s+Metadata\s*)?;?\s*/)
  const end = cursor + (suffix?.[0].length || 0)
  return `${content.slice(0, declaration.index)}${content.slice(end)}`
    .replace(
      /^\s*import\s+type\s+\{\s*Metadata\s*\}\s+from\s+["']next["'];?\s*$/m,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
}

export function normalizeGeneratedMetadataBoundaries(files: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(files).map(([path, content]) => [
      path,
      /^(?:src\/)?app\/(?:.*\/)?(?:layout|page)\.(?:tsx|jsx)$/.test(path)
        ? stripClientMetadataExport(content)
        : content,
    ]),
  )
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

export function normalizeGeneratedClientBoundaries(files: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(files).map(([path, content]) => {
      if (
        !/\.(?:tsx|jsx)$/.test(path) ||
        /^app\/api\//.test(path) ||
        !/\b(?:useState|useEffect|useReducer|useRef|useLayoutEffect|useCallback|useMemo)\s*\(/.test(content) ||
        /^\s*["']use client["'];?/m.test(content)
      ) {
        return [path, content]
      }
      return [path, `"use client"\n\n${content}`]
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

function regexEscape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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

  for (const [path, content] of Object.entries(files)) {
    if (
      /^(?:src\/)?app\/(?:.*\/)?(?:layout|page)\.(?:tsx|jsx)$/.test(path) &&
      /^\s*["']use client["'];?/m.test(content) &&
      /\bexport\s+const\s+metadata\b/.test(content)
    ) {
      errors.push(`Client component cannot export Next.js metadata: ${path}`)
    }
  }

  const hasRootPage = routeFileCandidates("/").some(
    (path) => typeof files[path] === "string" && files[path].trim(),
  )
  if (!hasRootPage) {
    errors.push("Missing required Next.js root route: / (app/page.tsx or src/app/page.tsx)")
  }

  for (const route of specification.routes) {
    if (route === "/" && !hasRootPage) continue
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
    "navigation": /<(?:header|nav)\b/i,
    "form": /<form\b/i,
    "data-table": /<table\b|role\s*=\s*["']grid["']/i,
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

  if (specification.requiredInteractions.includes("submit-booking")) {
    const bookingSource = routeFileCandidates("/booking")
      .map((path) => files[path] || "")
      .join("\n")
    if (!/<form\b/i.test(bookingSource) ||
        !/(?:onSubmit|action\s*=|formAction)/i.test(bookingSource) ||
        !/(?:date|time|appointment|booking)/i.test(bookingSource)) {
      errors.push("Booking route is missing a functional booking form with submit handling.")
    }
  }

  if (specification.platforms.includes("database")) {
    const schema = files["sql/schema.sql"] || ""
    if (!schema.trim()) {
      errors.push("Missing required database schema: sql/schema.sql")
    } else if (!/CREATE\s+TABLE/i.test(schema)) {
      errors.push("PostgreSQL schema does not create a database table.")
    }
    for (const table of specification.databaseTables || []) {
      const tablePattern = new RegExp(
        `CREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+["']?${regexEscape(table)}["']?\\b`,
        "i",
      )
      if (!tablePattern.test(schema)) {
        errors.push(`Missing requested database table: ${table}`)
      }
    }
  }

  const backendAcceptance = assessGeneratedBackend(specification, files)
  errors.push(...backendAcceptance.errors)
  warnings.push(...backendAcceptance.warnings)

  if (specification.systemBlueprint) {
    const requiredSystemFiles = [
      "shared/contracts.ts",
      "lib/server/tenant.ts",
      "lib/server/validation.ts",
      "sql/schema.sql",
      ...specification.systemBlueprint.apiResources.map((resource) =>
        `app/api/${resource}/route.ts`
      ),
      ...specification.systemBlueprint.apiResources.map((resource) =>
        `app/api/${resource}/[id]/route.ts`
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
    if (!/CREATE\s+TABLE/i.test(schema) ||
        !/audit/i.test(schema) ||
        !/\bREFERENCES\b/i.test(schema) ||
        !/\bCREATE\s+(?:UNIQUE\s+)?INDEX\b/i.test(schema) ||
        !/\bTIMESTAMPTZ\b/i.test(schema)) {
      errors.push("Operational PostgreSQL schema or audit storage is incomplete.")
    }
    for (const resource of specification.systemBlueprint.apiResources) {
      const collectionApi = files[`app/api/${resource}/route.ts`] || ""
      const itemApi = files[`app/api/${resource}/[id]/route.ts`] || ""
      if (!/export\s+async\s+function\s+GET/.test(collectionApi) ||
          !/export\s+async\s+function\s+POST/.test(collectionApi) ||
          !/export\s+async\s+function\s+GET/.test(itemApi) ||
          !/export\s+async\s+function\s+PATCH/.test(itemApi) ||
          !/export\s+async\s+function\s+DELETE/.test(itemApi)) {
        errors.push(`System CRUD API is not implemented: ${resource}`)
      }
    }
    const acceptance = assessGeneratedSystem({
      entities: specification.systemBlueprint.entities,
      apiResources: specification.systemBlueprint.apiResources,
      workflows: specification.systemBlueprint.workflows,
      tenantScoped: specification.systemBlueprint.tenantScoped,
      platforms: specification.platforms,
    }, files)
    errors.push(...acceptance.errors)
    const domainAcceptance = assessDomainAcceptance(
      specification.systemBlueprint.id,
      files,
    )
    errors.push(...domainAcceptance.errors)
  }
  if (specification.platforms.includes("mobile")) {
    for (const path of [
      "mobile/package.json",
      "mobile/app.json",
      "mobile/app/index.tsx",
      "mobile/services/api.ts",
    ]) {
      if (typeof files[path] !== "string" || !files[path].trim()) {
        errors.push(`Missing required mobile file: ${path}`)
      }
    }
  }

  if (/AI Generated Project|Top-tier digital craftsmanship|Enter the experience|Everything feels custom-built/i.test(combined)) {
    errors.push("Generic fallback content was detected.")
  }
  if (Object.keys(files).length < 3) warnings.push("The project contains very few files.")

  return { valid: errors.length === 0, errors, warnings }
}
