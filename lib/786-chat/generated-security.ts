export type GeneratedSecurityIssue = {
  code: string
  message: string
  path?: string
}

export type GeneratedSecurityResult = {
  valid: boolean
  errors: GeneratedSecurityIssue[]
  warnings: GeneratedSecurityIssue[]
}

const SECRET_PATH = /(?:^|\/)(?:\.env(?:\..+)?|\.npmrc|\.yarnrc|credentials\.json|service-account\.json|id_rsa|id_ed25519|.*\.(?:pem|p12|pfx|key))$/i
const ENV_PATH = /(?:^|\/)\.env(?:\..+)?$/i
const CODE_PATH = /\.(?:[cm]?[jt]sx?)$/i
const DOCUMENTATION_PATH = /(?:^|\/)(?:docs\/.*\.md|README(?:\.md)?)$/i
const SERVER_ROUTE = /^(?:src\/)?app\/api\/.+\/route\.(?:[cm]?[jt]s)$/i
const PUBLIC_AUTH_BOOTSTRAP_ROUTE = /^(?:src\/)?app\/api\/auth\/(?:register|login|logout|forgot-password|reset-password|verify-email)\/route\.(?:[cm]?[jt]s)$/i
const PUBLIC_READ_ONLY_ROUTE = /^(?:src\/)?app\/api\/public\/.+\/route\.(?:[cm]?[jt]s)$/i
const CLIENT_FILE = /^(?:src\/)?app\/.+\.(?:[cm]?[jt]sx?)$/i
const ACCESS_GUARD = /\b(?:requireTenant|requireCompany|assertTenant|requireUser|requireAuth|requireSession|getSession|getCurrentUser|getAuthenticatedUser|getUser|auth|session)\s*\(/i
const EXPORTED_GET = /export\s+(?:async\s+function\s+GET\b|const\s+GET\s*=)/
const EXPORTED_MUTATION = /export\s+(?:async\s+function\s+(?:POST|PUT|PATCH|DELETE)\b|const\s+(?:POST|PUT|PATCH|DELETE)\s*=)/
const PUBLIC_LOOKUP_TOKEN = /\b(?:public|scan|batch|record)[_-]?(?:id|token|code)\b/i
const DANGEROUS_CODE: Array<[string, RegExp, string]> = [
  ["DANGEROUS_PROCESS_EXECUTION", /(?:from\s+["']node:child_process["']|require\s*\(\s*["'](?:node:)?child_process["']\s*\)|\b(?:execSync|spawnSync|execFileSync|Bun\.spawn|Deno\.Command)\s*\()/, "Generated projects cannot execute operating-system commands."],
  ["DYNAMIC_CODE_EXECUTION", /\b(?:eval|Function)\s*\(|\bnew\s+Function\s*\(|from\s+["']node:vm["']/, "Generated projects cannot evaluate dynamic server code."],
  ["TLS_VERIFICATION_DISABLED", /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']?0|rejectUnauthorized\s*:\s*false/, "Generated projects cannot disable TLS certificate verification."],
  ["PROCESS_BINDING", /\bprocess\.(?:binding|dlopen)\s*\(/, "Generated projects cannot access native process bindings."],
]
const EMBEDDED_SECRET: Array<[string, RegExp]> = [
  ["PRIVATE_KEY", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["PROVIDER_API_KEY", /\b(?:sk-(?:live|proj)?-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[0-9A-Za-z-]{20,})\b/],
  ["DATABASE_CREDENTIAL", /\bpostgres(?:ql)?:\/\/[^\s:'"`]+:[^\s@'"`]+@/i],
]
const FORBIDDEN_DEPENDENCY_SOURCE = /^(?:https?:|git\+|git:|github:|file:|link:|workspace:|\.\.?\/)/i
const UNSAFE_VERSION = /^(?:\*|latest|next|canary)$/i
const INSTALL_SCRIPTS = new Set(["preinstall", "install", "postinstall", "prepare", "prepublish"])

function safeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function parsePackageJson(source: string | undefined) {
  if (!source) return null
  try {
    return safeObject(JSON.parse(source))
  } catch {
    return null
  }
}

function isPlaceholderEnvFile(path: string, content: string) {
  if (!ENV_PATH.test(path)) return false
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

function isSafePublicReadOnlyDatabaseRoute(path: string, content: string) {
  if (!PUBLIC_READ_ONLY_ROUTE.test(path)) return false
  return EXPORTED_GET.test(content) && !EXPORTED_MUTATION.test(content) && PUBLIC_LOOKUP_TOKEN.test(content)
}

export function validateGeneratedSecurity(files: Record<string, string>): GeneratedSecurityResult {
  const errors: GeneratedSecurityIssue[] = []
  const warnings: GeneratedSecurityIssue[] = []

  for (const [path, content] of Object.entries(files)) {
    const normalizedPath = path.replace(/\\/g, "/").replace(/^\.\//, "")
    const placeholderEnv = isPlaceholderEnvFile(normalizedPath, content)
    if (SECRET_PATH.test(normalizedPath) && !placeholderEnv) {
      errors.push({ code: "SECRET_FILE", path, message: "Credential and private-key files cannot be saved or deployed." })
    }
    if (!placeholderEnv) {
      for (const [kind, pattern] of EMBEDDED_SECRET) {
        if (pattern.test(content)) {
          if (DOCUMENTATION_PATH.test(normalizedPath) && kind !== "PRIVATE_KEY") {
            warnings.push({ code: `DOCUMENTED_${kind}`, path, message: "A secret-like credential example appears in generated documentation. Replace it with an environment-variable placeholder before sharing the documentation." })
          } else {
            errors.push({ code: `EMBEDDED_${kind}`, path, message: "A secret-like value is embedded in generated source. Store it as an encrypted project secret instead." })
          }
        }
      }
    }
    if (!CODE_PATH.test(normalizedPath)) continue
    for (const [code, pattern, message] of DANGEROUS_CODE) {
      if (pattern.test(content)) errors.push({ code, path, message })
    }
    if (
      CLIENT_FILE.test(normalizedPath) &&
      !SERVER_ROUTE.test(normalizedPath) &&
      /^\s*["']use client["'];?/m.test(content)
    ) {
      if (/\b(?:DATABASE_URL|NEON_DATABASE_URL|SECRET_ENCRYPTION_KEY)\b/.test(content)) {
        errors.push({ code: "CLIENT_SECRET_REFERENCE", path, message: "Database credentials and encryption keys are server-only." })
      }
      if (/\bNEXT_PUBLIC_(?:DATABASE|NEON|SECRET|API_KEY)/.test(content)) {
        errors.push({ code: "PUBLIC_SECRET_REFERENCE", path, message: "Secrets cannot use a NEXT_PUBLIC_ environment variable." })
      }
    }
    if (
      SERVER_ROUTE.test(normalizedPath) &&
      !PUBLIC_AUTH_BOOTSTRAP_ROUTE.test(normalizedPath) &&
      /\b(?:DATABASE_URL|neon\s*\(|sql`)/.test(content)
    ) {
      if (PUBLIC_READ_ONLY_ROUTE.test(normalizedPath) && EXPORTED_MUTATION.test(content)) {
        errors.push({ code: "PUBLIC_DATABASE_MUTATION", path, message: "Public database routes must be read-only. Move create/update/delete operations behind authenticated APIs." })
      } else if (!ACCESS_GUARD.test(content) && !isSafePublicReadOnlyDatabaseRoute(normalizedPath, content)) {
        errors.push({ code: "DATABASE_ROUTE_WITHOUT_ACCESS_GUARD", path, message: "Database API routes must authenticate the user or enforce tenant ownership before querying data. Explicit public scan routes may be GET-only and token-scoped." })
      }
    }
  }

  const packageJson = parsePackageJson(files["package.json"])
  if (packageJson) {
    const scripts = safeObject(packageJson.scripts)
    for (const script of INSTALL_SCRIPTS) {
      if (typeof scripts[script] === "string") {
        errors.push({ code: "DEPENDENCY_LIFECYCLE_SCRIPT", path: "package.json", message: `The ${script} lifecycle script is not allowed.` })
      }
    }
    for (const section of ["dependencies", "devDependencies", "optionalDependencies"] as const) {
      const dependencies = safeObject(packageJson[section])
      for (const [name, rawVersion] of Object.entries(dependencies)) {
        if (!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i.test(name)) {
          errors.push({ code: "INVALID_DEPENDENCY_NAME", path: "package.json", message: `Dependency name ${name} is invalid.` })
          continue
        }
        if (typeof rawVersion !== "string" || FORBIDDEN_DEPENDENCY_SOURCE.test(rawVersion.trim())) {
          errors.push({ code: "UNTRUSTED_DEPENDENCY_SOURCE", path: "package.json", message: `${name} must come from the configured package registry.` })
        } else if (UNSAFE_VERSION.test(rawVersion.trim())) {
          errors.push({ code: "UNPINNED_DEPENDENCY", path: "package.json", message: `${name} must use an explicit version range.` })
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
