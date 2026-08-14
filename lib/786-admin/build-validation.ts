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

const MAX_FILES = 500
const MAX_FILE_BYTES = 500_000
const MAX_TOTAL_BYTES = 8_000_000
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

export function validateGeneratedProject(
  files: Record<string, string>,
): BuildValidationResult {
  const errors: BuildValidationIssue[] = []
  const warnings: BuildValidationIssue[] = []
  const entries = Object.entries(files)

  if (entries.length === 0) {
    errors.push({ code: "NO_FILES", message: "The project has no files." })
  }
  if (entries.length > MAX_FILES) {
    errors.push({
      code: "TOO_MANY_FILES",
      message: `The project contains ${entries.length} files; the limit is ${MAX_FILES}.`,
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
    if (bytes > MAX_FILE_BYTES) {
      errors.push({
        code: "FILE_TOO_LARGE",
        path,
        message: `File exceeds the ${MAX_FILE_BYTES.toLocaleString()} byte limit.`,
      })
    }
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    errors.push({
      code: "PROJECT_TOO_LARGE",
      message: `Project source exceeds the ${MAX_TOTAL_BYTES.toLocaleString()} byte limit.`,
    })
  }

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

  if (packageJson) {
    if (!allDependencies.next) {
      errors.push({ code: "MISSING_NEXT", path: "package.json", message: "The Next.js dependency is required." })
    }
    if (!allDependencies.react || !allDependencies["react-dom"]) {
      errors.push({ code: "MISSING_REACT", path: "package.json", message: "React and React DOM are required." })
    }
    if (!scripts.build) {
      errors.push({ code: "MISSING_BUILD_SCRIPT", path: "package.json", message: "A build script is required." })
    }
    if (!scripts.lint) {
      warnings.push({ code: "MISSING_LINT_SCRIPT", path: "package.json", message: "No lint script was provided." })
    }

    for (const packageName of PROHIBITED_PROVIDER_PACKAGES) {
      if (allDependencies[packageName]) {
        errors.push({
          code: "PROHIBITED_AI_PROVIDER",
          path: "package.json",
          message: `${packageName} is not allowed. Use DeepSeek or Gemini only.`,
        })
      }
    }
  }

  const security = validateGeneratedSecurity(files)
  errors.push(...security.errors)
  warnings.push(...security.warnings)

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
  commands.push("npx tsc --noEmit", `${runner} build`)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileCount: entries.length,
    packageManager,
    commands,
  }
}
