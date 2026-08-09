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
const CODE_PATH = /\.(?:[cm]?[jt]sx?)$/i
const SERVER_ROUTE = /^(?:src\/)?app\/api\/.+\/route\.(?:[cm]?[jt]s)$/i
const CLIENT_FILE = /^(?:src\/)?app\/.+\.(?:[cm]?[jt]sx?)$/i
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

function isPlaceholderEnvExample(path: string, content: string) {
  if (!/(?:^|\/)\.env\.example$/i.test(path)) return false
  const meaningfulLines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
  if (meaningfulLines.length === 0) return true
  return meaningfulLines.every((line) => {
    const match = line.match(/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/)
    if (!match) return false
    const value = match[2].trim().replace(/^['"]|['"]$/g, "")
    return value === "" || /^(?:your[_-].*|change[_-]?me|example|placeholder|<.*>|\$\{.*\})$/i.test(value)
  })
}

export function validateGeneratedSecurity(files: Record<string, string>): GeneratedSecurityResult {
  const errors: GeneratedSecurityIssue[] = []
  const warnings: GeneratedSecurityIssue[] = []

  for (const [path, content] of Object.entries(files)) {
    const normalizedPath = path.replace(/\\/g, "/").replace(/^\.\//, "")
    if (SECRET_PATH.test(normalizedPath) && !isPlaceholderEnvExample(normalizedPath, content)) {
      errors.push({ code: "SECRET_FILE", path, message: "Credential and private-key files cannot be saved or deployed." })
    }
    for (const [kind, pattern] of EMBEDDED_SECRET) {
      if (pattern.test(content)) {
        errors.push({ code: `EMBEDDED_${kind}`, path, message: "A secret-like value is embedded in generated source. Store it as an encrypted project secret instead." })
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
    if (SERVER_ROUTE.test(normalizedPath) && /\b(?:DATABASE_URL|neon\s*\(|sql`)/.test(content)) {
      if (!/\b(?:requireTenant|requireCompany|assertTenant|requireUser|getSession|auth)\s*\(/.test(content)) {
        errors.push({ code: "DATABASE_ROUTE_WITHOUT_ACCESS_GUARD", path, message: "Database API routes must authenticate the user or enforce tenant ownership before querying data." })
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
