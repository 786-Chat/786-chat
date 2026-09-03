import { validateGeneratedSecurity } from "@/lib/786-chat/generated-security"

export type BuildValidationIssue = {
  code: string
  message: string
  path?: string
}

export type BuildValidationResult = {
  valid: boolean
  errors: BuildValidationIssue[]
  warnings: BuildValidationIssue[]
  fileCount: number
  packageManager: "npm" | "pnpm" | "yarn"
  commands: string[]
}

export type BuildValidationOptions = {
  imported?: boolean
  framework?: string
}

const DEFAULT_MAX_FILES = 500
const DEFAULT_MAX_FILE_BYTES = 500_000
const DEFAULT_MAX_TOTAL_BYTES = 8_000_000
const IMPORT_MAX_FILES = 900
const IMPORT_MAX_FILE_BYTES = 1_500_000
const IMPORT_MAX_TOTAL_BYTES = 24_000_000
const FORBIDDEN_PATH_PARTS = ["node_modules", ".git", ".next", ".vercel"]
const SECRET_FILE_NAMES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "service-account.json",
])
const PROHIBITED_PROVIDER_PACKAGES = [
  "@ai-sdk/anthropic",
  "@anthropic-ai/sdk",
  "openai",
  "@ai-sdk/openai",
]
const IMPORT_SECURITY_BLOCKERS = /(?:SECRET|PRIVATE_KEY|DATABASE_CREDENTIAL|PROVIDER_API_KEY|DEPENDENCY_LIFECYCLE_SCRIPT|UNTRUSTED_DEPENDENCY_SOURCE|INVALID_DEPENDENCY_NAME|UNPINNED_DEPENDENCY)/

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "")
}

function isSafePath(path: string): boolean {
  if (!path || path.startsWith("/") || path.includes("\0")) return false
  const parts = normalizePath(path).split("/")
  if (parts.some((part) => !part || part === "." || part === "..")) return false
  return !parts.some((part) => FORBIDDEN_PATH_PARTS.includes(part))
}

function isPlaceholderEnvFile(path: string, content: string): boolean {
  if (!/(?:^|\/)\.env(?:\..+)?$/i.test(path)) return false
  const meaningfulLines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
  if (meaningfulLines.length === 0) return true
  return meaningfulLines.every((line) => {
    const match = line.match(/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/)
    if (!match) return false
    const value = match[2].trim().replace(/^['"]|['"]$/g, "")
    return value === "" || /^(?:your[_-].*|change[_-]?me|example|placeholder|<.*>|\$\{.*\}|REPLACE_ME)$/i.test(value)
  })
}

function parsePackageJson(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function recordOfStrings(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  )
}

function importedFramework(
  requested: string | undefined,
  allDependencies: Record<string, string>,
) {
  const explicit = String(requested || "").trim().toLowerCase()
  if (explicit && explicit !== "unknown") return explicit
  if (allDependencies.next) return "nextjs"
  if (allDependencies.vite && allDependencies.express) return "vite-express"
  if (allDependencies.vite) return "vite"
  if (allDependencies.express) return "express"
  return "node"
}

export function validateGeneratedProject(
  files: Record<string, string>,
  options: BuildValidationOptions = {},
): BuildValidationResult {
  const errors: BuildValidationIssue[] = []
  const warnings: BuildValidationIssue[] = []
  const entries = Object.entries(files)
  const imported = options.imported === true
  const maxFiles = imported ? IMPORT_MAX_FILES : DEFAULT_MAX_FILES
  const maxFileBytes = imported ? IMPORT_MAX_FILE_BYTES : DEFAULT_MAX_FILE_BYTES
  const maxTotalBytes = imported ? IMPORT_MAX_TOTAL_BYTES : DEFAULT_MAX_TOTAL_BYTES

  if (entries.length === 0) {
    errors.push({ code: "NO_FILES", message: "The project has no files." })
  }
  if (entries.length > maxFiles) {
    errors.push({
      code: "TOO_MANY_FILES",
      message: `The project contains ${entries.length} files; the limit is ${maxFiles}.`,
    })
  }

  let totalBytes = 0
  for (const [rawPath, content] of entries) {
    const path = normalizePath(rawPath)
    const bytes = Buffer.byteLength(content, "utf8")
    totalBytes += bytes

    if (!isSafePath(path)) {
      errors.push({ code: "UNSAFE_PATH", path: rawPath, message: "Unsafe project path." })
    }
    if ((SECRET_FILE_NAMES.has(path.toLowerCase()) || path.toLowerCase().startsWith(".env.")) && !isPlaceholderEnvFile(path, content)) {
      errors.push({
        code: "SECRET_FILE",
        path,
        message: "Environment and credential files cannot be published unless they contain placeholders only.",
      })
    }
    if (bytes > maxFileBytes) {
      errors.push({
        code: "FILE_TOO_LARGE",
        path,
        message: `File exceeds the ${maxFileBytes.toLocaleString()} byte limit.`,
      })
    }
  }

  if (totalBytes > maxTotalBytes) {
    errors.push({
      code: "PROJECT_TOO_LARGE",
      message: `Project source exceeds the ${maxTotalBytes.toLocaleString()} byte limit.`,
    })
  }

  const packageSource = files["package.json"]
  const packageJson = packageSource ? parsePackageJson(packageSource) : null
  if (!packageSource) {
    errors.push({ code: "MISSING_PACKAGE_JSON", message: "package.json is required." })
  } else if (!packageJson) {
    errors.push({ code: "INVALID_PACKAGE_JSON", path: "package.json", message: "package.json is invalid JSON." })
  }

  const dependencies = recordOfStrings(packageJson?.dependencies)
  const devDependencies = recordOfStrings(packageJson?.devDependencies)
  const allDependencies = { ...dependencies, ...devDependencies }
  const scripts = recordOfStrings(packageJson?.scripts)
  const framework = importedFramework(options.framework, allDependencies)

  if (imported) {
    if (!allDependencies.react || !allDependencies["react-dom"]) {
      errors.push({ code: "MISSING_REACT", path: "package.json", message: "Imported web projects must include React and React DOM." })
    }
    if (framework === "nextjs") {
      const homePage = entries.find(([path]) => /^(src\/)?app\/page\.(tsx?|jsx?)$/.test(normalizePath(path)))
      if (!homePage) {
        errors.push({ code: "MISSING_HOME_PAGE", message: "The imported Next.js project is missing its App Router home page." })
      }
      if (!allDependencies.next) {
        errors.push({ code: "MISSING_NEXT", path: "package.json", message: "The imported Next.js project is missing the Next.js dependency." })
      }
    } else if (framework === "vite-express") {
      if (!allDependencies.vite) {
        errors.push({ code: "MISSING_VITE", path: "package.json", message: "The imported Vite project is missing Vite." })
      }
      if (!allDependencies.express) {
        errors.push({ code: "MISSING_EXPRESS", path: "package.json", message: "The imported Express project is missing Express." })
      }
      if (!files["client/index.html"] && !files["index.html"]) {
        errors.push({ code: "MISSING_VITE_ENTRY", message: "The imported Vite project is missing client/index.html or index.html." })
      }
      if (!files["server/index.ts"] && !files["server/index.js"] && !files["index.ts"] && !files["index.js"]) {
        errors.push({ code: "MISSING_SERVER_ENTRY", message: "The imported Express project is missing its server entrypoint." })
      }
    } else if (framework === "vite" && !allDependencies.vite) {
      errors.push({ code: "MISSING_VITE", path: "package.json", message: "The imported Vite project is missing Vite." })
    } else if (framework === "express" && !allDependencies.express) {
      errors.push({ code: "MISSING_EXPRESS", path: "package.json", message: "The imported Express project is missing Express." })
    }
  } else {
    const homePage = entries.find(([path]) => /^(src\/)?app\/page\.(tsx?|jsx?)$/.test(normalizePath(path)))
    if (!homePage) {
      errors.push({
        code: "MISSING_HOME_PAGE",
        message: "A Next.js App Router entry file (app/page.tsx or src/app/page.tsx) is required.",
      })
    }

    if (files["next.config.ts"]) {
      errors.push({
        code: "UNSUPPORTED_NEXT_CONFIG_TS",
        path: "next.config.ts",
        message: "Use next.config.mjs or next.config.js; next.config.ts is not portable across allowed Next.js versions.",
      })
    }
  }

  if (packageJson) {
    if (!imported && !allDependencies.next) {
      errors.push({ code: "MISSING_NEXT", path: "package.json", message: "The Next.js dependency is required." })
    }
    if (!imported && (!allDependencies.react || !allDependencies["react-dom"])) {
      errors.push({ code: "MISSING_REACT", path: "package.json", message: "React and React DOM are required." })
    }
    if (!scripts.build) {
      errors.push({ code: "MISSING_BUILD_SCRIPT", path: "package.json", message: "A build script is required." })
    }
    if (!scripts.lint) {
      warnings.push({ code: "MISSING_LINT_SCRIPT", path: "package.json", message: "No lint script was provided." })
    }

    for (const packageName of PROHIBITED_PROVIDER_PACKAGES) {
      if (!allDependencies[packageName]) continue
      const issue = {
        code: "PROHIBITED_AI_PROVIDER",
        path: "package.json",
        message: `${packageName} is not allowed for newly generated applications. Imported legacy source may keep it temporarily, but no provider secret is imported automatically.`,
      }
      if (imported) warnings.push(issue)
      else errors.push(issue)
    }
  }

  const security = validateGeneratedSecurity(files)
  if (imported) {
    for (const issue of security.errors) {
      if (IMPORT_SECURITY_BLOCKERS.test(issue.code)) errors.push(issue)
      else warnings.push({ ...issue, message: `Imported source warning: ${issue.message}` })
    }
    warnings.push(...security.warnings)
  } else {
    errors.push(...security.errors)
    warnings.push(...security.warnings)
  }

  const packageManager: BuildValidationResult["packageManager"] = files["pnpm-lock.yaml"]
    ? "pnpm"
    : files["yarn.lock"]
      ? "yarn"
      : "npm"
  const runner = packageManager === "npm" ? "npm run" : packageManager
  const install = packageManager === "npm"
    ? files["package-lock.json"]
      ? "npm ci --ignore-scripts"
      : "npm install --ignore-scripts"
    : packageManager === "pnpm"
      ? files["pnpm-lock.yaml"]
        ? "pnpm install --frozen-lockfile --ignore-scripts"
        : "pnpm install --ignore-scripts"
      : files["yarn.lock"]
        ? "yarn install --frozen-lockfile --ignore-scripts"
        : "yarn install --ignore-scripts"
  const commands = [install]
  if (scripts.lint) commands.push(`${runner} lint`)
  if (imported && scripts.check) commands.push(`${runner} check`)
  else commands.push("npx tsc --noEmit")
  commands.push(`${runner} build`)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileCount: entries.length,
    packageManager,
    commands,
  }
}