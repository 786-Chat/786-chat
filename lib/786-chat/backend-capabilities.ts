import type { ProjectSpecification } from "./specification"

export type BackendCapability = "database" | "authentication" | "storage" | "email" | "api"
export type BackendAcceptance = { valid: boolean; errors: string[]; warnings: string[] }
const CAPABILITY_ORDER: BackendCapability[] = ["database", "authentication", "storage", "email", "api"]
const AUTH_TABLE_NAMES = ["users", "sessions", "email_verification_tokens", "password_reset_tokens"] as const
const AUTH_SUPPORT_TABLE_NAMES = ["sessions", "email_verification_tokens", "password_reset_tokens"] as const
const BACKEND_DEPENDENCY_VERSIONS: Record<string, string> = {
  "server-only": "^0.0.1",
  zod: "^3.24.1",
  "@neondatabase/serverless": "^1.1.0",
  bcryptjs: "^3.0.3",
  jose: "^6.2.3",
  "@vercel/blob": "^2.4.0",
  resend: "^6.0.1",
}
function unique<T>(values: T[]) { return Array.from(new Set(values)) }
function normalizedResource(value: string) { return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") }

export function backendCapabilities(specification: ProjectSpecification): BackendCapability[] {
  const requested = new Set(specification.backendRequirements)
  const capabilities: BackendCapability[] = []
  const needsAuthentication = requested.has("authentication") || requested.has("file-storage") || Boolean(specification.systemBlueprint)
  const needsDatabase = specification.platforms.includes("database") || needsAuthentication
  const needsApi = specification.platforms.includes("backend") || needsAuthentication
  if (needsDatabase) capabilities.push("database")
  if (needsAuthentication) capabilities.push("authentication")
  if (requested.has("file-storage")) capabilities.push("storage")
  if (requested.has("email") || needsAuthentication) capabilities.push("email")
  if (requested.has("api") || requested.has("payments") || needsApi) capabilities.push("api")
  return CAPABILITY_ORDER.filter((capability) => capabilities.includes(capability))
}

export function backendApiResources(specification: ProjectSpecification) {
  return unique([...(specification.systemBlueprint?.apiResources || []), ...(specification.databaseTables || [])]).map(normalizedResource).filter(Boolean)
}

export function requiredBackendFiles(specification: ProjectSpecification) {
  const capabilities = backendCapabilities(specification)
  if (capabilities.length === 0) return []
  const files = ["backend/manifest.json", "lib/server/env.ts", "docs/backend-setup.md"]
  if (capabilities.includes("database")) files.push("lib/server/db.ts", "sql/schema.sql", "sql/migrations/001_initial.sql", "scripts/migrate.mjs")
  if (capabilities.includes("authentication")) files.push("lib/server/auth.ts", "app/api/auth/register/route.ts", "app/api/auth/login/route.ts", "app/api/auth/logout/route.ts", "app/api/auth/session/route.ts", "app/api/auth/forgot-password/route.ts", "app/api/auth/reset-password/route.ts", "app/api/auth/verify-email/route.ts")
  if (capabilities.includes("storage")) files.push("app/api/uploads/route.ts", "app/api/uploads/[id]/route.ts")
  if (capabilities.includes("email")) files.push("lib/server/email.ts", "app/api/email/route.ts")
  if (capabilities.includes("api")) for (const resource of backendApiResources(specification)) files.push(`app/api/${resource}/route.ts`, `app/api/${resource}/[id]/route.ts`)
  return unique(files)
}

function requiredBackendDependencies(capabilities: BackendCapability[]) {
  return unique([
    "server-only",
    "zod",
    ...(capabilities.includes("database") ? ["@neondatabase/serverless"] : []),
    ...(capabilities.includes("authentication") ? ["bcryptjs", "jose"] : []),
    ...(capabilities.includes("storage") ? ["@vercel/blob"] : []),
    ...(capabilities.includes("email") ? ["resend"] : []),
  ])
}

export function normalizeGeneratedBackendDependencies(specification: ProjectSpecification, files: Record<string, string>) {
  const capabilities = backendCapabilities(specification)
  if (!capabilities.length || !files["package.json"]) return files
  try {
    const packageJson = JSON.parse(files["package.json"]) as Record<string, unknown>
    const dependencies = packageJson.dependencies && typeof packageJson.dependencies === "object" && !Array.isArray(packageJson.dependencies)
      ? packageJson.dependencies as Record<string, string>
      : {}
    let changed = false
    for (const dependency of requiredBackendDependencies(capabilities)) {
      if (!dependencies[dependency]) {
        dependencies[dependency] = BACKEND_DEPENDENCY_VERSIONS[dependency]
        changed = true
      }
    }
    if (changed || packageJson.dependencies !== dependencies) {
      packageJson.dependencies = dependencies
      files["package.json"] = `${JSON.stringify(packageJson, null, 2)}\n`
    }
  } catch {
    // Invalid package.json remains a validation error for the repair engine.
  }
  return files
}

export function backendCapabilityBrief(specification: ProjectSpecification): string[] {
  const capabilities = backendCapabilities(specification)
  if (capabilities.length === 0) return []
  const resources = backendApiResources(specification)
  const requiresAuthentication = capabilities.includes("authentication")
  return [
    `Backend capabilities: ${capabilities.join(", ")}`,
    `Mandatory backend files: ${requiredBackendFiles(specification).join(", ")}`,
    "When extending an existing project, mandatory backend files take priority over cosmetic rewrites. Return every missing backend file and only the frontend files that must change. Never omit schema, migration, manifest or API files to save output tokens.",
    "backend/manifest.json must declare version 1 and may declare capabilities either as top-level provider objects or in a capabilities array. It must include every resource provider, required environment variable name, migration path and API route without containing secret values.",
    "lib/server/env.ts must be server-only, validate required environment variables with Zod and fail closed. Never use NEXT_PUBLIC_ for database, authentication, Blob or email secrets.",
    ...(capabilities.includes("database") ? ["Use @neondatabase/serverless through a lazy getDb/getSql function in lib/server/db.ts; do not instantiate the connection at module load and do not use a Proxy. A function declaration or const arrow function is valid. DATABASE_URL may be loaded through lib/server/env.ts, but the Neon client itself must still be created lazily inside getDb/getSql.", "Emit repeatable Neon/PostgreSQL SQL in both sql/schema.sql and sql/migrations/001_initial.sql, including primary keys, foreign keys, TIMESTAMPTZ timestamps, indexes and non-destructive IF NOT EXISTS statements.", "SQL table identifiers must use letters, numbers and underscores. Keep route slugs separate from table names: for example API resource production-records maps to SQL table production_records.", "scripts/migrate.mjs must read the checked-in migration and apply it only through DATABASE_URL. It must not run shell commands or silently ignore migration errors."] : []),
    ...(requiresAuthentication ? ["AUTHENTICATION SQL CONTRACT: BOTH sql/schema.sql and sql/migrations/001_initial.sql must create tables with these exact names: users, sessions, email_verification_tokens, password_reset_tokens. Do not rename, alias or substitute any of these tables.", "Implement Neon-backed users, sessions, email verification tokens and password reset tokens. Hash passwords with bcryptjs and hash stored one-time/session tokens before persistence.", "Authentication cookies must be HttpOnly, SameSite=Lax or Strict, Secure in production, scoped to Path=/ and expire server-side. Register, login, logout, session, verification and reset routes must be functional.", "Use jose with an AUTH_SECRET that has no hard-coded fallback. Sign sessions with SignJWT and verify them with jwtVerify. The bcryptjs and jose implementation may be split between lib/server/auth.ts and the auth route files, but both protections must be complete.", "Rotate/revoke sessions on password reset and never reveal whether a forgot-password email exists."] : []),
    ...(capabilities.includes("storage") ? ["Use @vercel/blob private storage. Upload routes must authenticate first, enforce file size and MIME allowlists, prefix Blob paths with the authenticated owner/tenant, and persist upload metadata in Neon. Prefer an explicit pattern such as const user = await requireUser(); const pathname = `documents/${user.id}/${safeFilename}` before calling put(pathname, file, { access: 'private' }).", "Download/delete routes must re-check database ownership before issuing a private download URL or deleting a Blob."] : []),
    ...(capabilities.includes("email") ? ["Use Resend only in lib/server/email.ts with RESEND_API_KEY and EMAIL_FROM. Validate recipients, use an idempotency key, return a typed result and never expose provider errors or credentials to the browser.", "app/api/email/route.ts must validate the request with Zod and authenticate the user with requireUser/requireAuth/getSession/getCurrentUser, or enforce a persistent rate limit for an explicitly public contact form, before it sends email.", "For an authenticated business application, prefer authentication on app/api/email/route.ts. Do not treat a UI-only check, hidden field, or client-side token as authentication."] : []),
    ...(capabilities.includes("api") ? [`API resources: ${resources.join(", ") || "authentication routes only"}`, ...(requiresAuthentication ? ["Every protected data route must authenticate, validate path/body/query input with Zod, scope every query by owner or tenant, use parameterized Neon queries and return explicit 400/401/403/404/409/429/500 responses. An explicitly public scan/label route may be GET-only and token-scoped, must expose only safe fields, and must never create, update or delete data."] : ["The request does not require authentication. Do not invent an auth dependency. Public data routes must still validate path/body/query input with Zod, use parameterized Neon queries, avoid exposing secrets and return explicit 400/404/409/429/500 responses."]), "For every CRUD API resource, create both the collection route and [id] item route. The collection route must export GET and POST; the item route must export GET, PATCH and DELETE. Explicit public read-only scan routes are not CRUD resources and must remain GET-only. Both `export async function METHOD` and `export const METHOD = async` are valid."] : []),
    "package.json must contain explicit non-latest semver ranges for every imported server package, including server-only, zod and each selected provider SDK.",
    "docs/backend-setup.md must list setup and migration commands plus environment variable names only; never generate an .env file or credential value.",
  ]
}

function parsePackage(source: string | undefined) { try { const value = JSON.parse(source || "") as { dependencies?: Record<string, string> }; return value.dependencies || {} } catch { return {} as Record<string, string> } }
function hasGuard(content: string) { return /\b(?:requireUser|requireAuth|requireTenant|requireCompany|assertTenant|getSession|getCurrentUser|getAuthenticatedUser|auth|session)\s*\(/.test(content) }
function authenticationImplementationSource(files: Record<string, string>) {
  return [
    files["lib/server/auth.ts"],
    files["app/api/auth/register/route.ts"],
    files["app/api/auth/login/route.ts"],
    files["app/api/auth/logout/route.ts"],
    files["app/api/auth/session/route.ts"],
    files["app/api/auth/forgot-password/route.ts"],
    files["app/api/auth/reset-password/route.ts"],
    files["app/api/auth/verify-email/route.ts"],
  ].filter(Boolean).join("\n")
}
function hasSecurePasswordAndJoseAuth(files: Record<string, string>) {
  const source = authenticationImplementationSource(files)
  const importsBcrypt = /(?:from\s+["']bcryptjs["']|require\s*\(\s*["']bcryptjs["']\s*\))/.test(source)
  const usesBcrypt = /\b(?:hash|compare|hashSync|compareSync)\s*\(/.test(source)
  const importsJose = /(?:from\s+["']jose["']|require\s*\(\s*["']jose["']\s*\))/.test(source)
  const signsSession = /\bSignJWT\b/.test(source)
  const verifiesSession = /\bjwtVerify\b/.test(source)
  return importsBcrypt && usesBcrypt && importsJose && signsSession && verifiesSession
}
function hasAuthenticatedBlobPathScope(content: string) {
  if (!hasGuard(content)) return false
  const identity = /\b(?:owner(?:Id|Email)?|tenant(?:Id)?|company(?:Id)?|user(?:Id|Email)?|currentUser|authenticatedUser|session(?:User)?|session|accountId)\b/i
  const blobPath = /\b(?:pathname|path|key|blobName|blobPath)\b/i
  if (!identity.test(content) || !blobPath.test(content)) return false
  const forward = new RegExp(`${identity.source}[\\s\\S]{0,1200}${blobPath.source}`, "i")
  const backward = new RegExp(`${blobPath.source}[\\s\\S]{0,1200}${identity.source}`, "i")
  return forward.test(content) || backward.test(content)
}
function hasFile(files: Record<string, string>, path: string) { return typeof files[path] === "string" && Boolean(files[path].trim()) }
function manifestDeclaresCapability(manifest: Record<string, unknown>, capability: BackendCapability) {
  if (manifest[capability]) return true
  const declared = manifest.capabilities
  if (Array.isArray(declared)) return declared.some((value) => String(value).toLowerCase() === capability)
  if (declared && typeof declared === "object") return Boolean((declared as Record<string, unknown>)[capability])
  return false
}
function hasRouteMethod(content: string, method: "GET" | "POST" | "PATCH" | "DELETE") { return new RegExp(`export\\s+async\\s+function\\s+${method}\\b`).test(content) || new RegExp(`export\\s+const\\s+${method}\\s*=`).test(content) }
function hasZodValidation(content: string) { const directSchema = /\bz\.(?:object|string|coerce|array|union|enum|number|boolean|date)\b/.test(content); const importsZod = /from\s+["']zod["']/.test(content); const parsesInput = /\.(?:safeParse|parse|parseAsync)\s*\(/.test(content); return directSchema || (importsZod && parsesInput) || parsesInput }
function hasLazyNeonGetter(db: string, env: string) { const combined = `${db}\n${env}`; const hasNeon = /@neondatabase\/serverless/.test(db); const hasDatabaseUrl = /\bDATABASE_URL\b/.test(combined); const functionGetter = /\bfunction\s+get(?:Db|Sql)\b/.test(db); const constGetter = /\bconst\s+get(?:Db|Sql)\s*=\s*(?:async\s*)?\(/.test(db) || /\bconst\s+get(?:Db|Sql)\s*=\s*(?:async\s*)?[^=\n]+=>/.test(db); const noProxy = !/\bnew\s+Proxy\b/.test(db); return hasNeon && hasDatabaseUrl && (functionGetter || constGetter) && noProxy }
function hasSqlTable(sql: string, table: string) { return new RegExp(`CREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+["']?${table}\\b`, "i").test(sql) }
function inferUsersIdSqlType(sql: string) {
  const users = sql.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+["']?users["']?\s*\(([\s\S]*?)\)\s*;/i)?.[1] || ""
  const candidate = users.match(/(?:^|[,\n])\s*["']?id["']?\s+([a-z][a-z0-9_]*(?:\s*\([^)]*\))?)/i)?.[1]?.trim() || "TEXT"
  return /^(?:uuid|text|varchar(?:\s*\(\s*\d+\s*\))?|character\s+varying(?:\s*\(\s*\d+\s*\))?)$/i.test(candidate) ? candidate : "TEXT"
}
function authSupportTableSql(table: typeof AUTH_SUPPORT_TABLE_NAMES[number], userIdType: string) {
  return `CREATE TABLE IF NOT EXISTS ${table} (\n  id TEXT PRIMARY KEY,\n  user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  token_hash TEXT NOT NULL UNIQUE,\n  expires_at TIMESTAMPTZ NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\nCREATE INDEX IF NOT EXISTS ${table}_user_id_idx ON ${table}(user_id);\nCREATE INDEX IF NOT EXISTS ${table}_expires_at_idx ON ${table}(expires_at);`
}
export function normalizeGeneratedAuthenticationSchema(specification: ProjectSpecification, files: Record<string, string>) {
  if (!backendCapabilities(specification).includes("authentication")) return files
  for (const path of ["sql/schema.sql", "sql/migrations/001_initial.sql"]) {
    const source = files[path] || ""
    if (!source.trim() || !hasSqlTable(source, "users")) continue
    const userIdType = inferUsersIdSqlType(source)
    const missing = AUTH_SUPPORT_TABLE_NAMES.filter((table) => !hasSqlTable(source, table))
    if (!missing.length) continue
    files[path] = `${source.trimEnd()}\n\n-- 786.Chat auth compatibility: exact required auth table names\n${missing.map((table) => authSupportTableSql(table, userIdType)).join("\n\n")}\n`
  }
  return files
}
function backendRepairError(message: string) { return `Backend CRUD repair: ${message}` }

export function assessGeneratedBackend(specification: ProjectSpecification, files: Record<string, string>): BackendAcceptance {
  const capabilities = backendCapabilities(specification)
  normalizeGeneratedAuthenticationSchema(specification, files)
  normalizeGeneratedBackendDependencies(specification, files)
  const errors: string[] = []
  const warnings: string[] = []
  if (capabilities.length === 0) return { valid: true, errors, warnings }
  for (const path of requiredBackendFiles(specification)) if (!hasFile(files, path)) errors.push(backendRepairError(`Missing required backend file: ${path}`))
  const manifestSource = files["backend/manifest.json"] || ""
  try {
    const manifest = JSON.parse(manifestSource) as Record<string, unknown>
    if (manifest.version !== 1) errors.push(backendRepairError("Backend manifest must use version 1."))
    for (const capability of capabilities) if (!manifestDeclaresCapability(manifest, capability)) errors.push(backendRepairError(`Backend manifest does not declare ${capability}.`))
  } catch { errors.push(backendRepairError("backend/manifest.json must contain valid JSON.")) }
  const env = files["lib/server/env.ts"] || ""
  if (!/import\s+["']server-only["']/.test(env) || !/\bz\.(?:object|string)\b/.test(env)) errors.push(backendRepairError("Server environment configuration must be server-only and validated with Zod."))
  const combinedServer = Object.entries(files).filter(([path]) => /^(?:lib\/server|app\/api)\//.test(path)).map(([, content]) => content).join("\n")
  if (/\bNEXT_PUBLIC_(?:DATABASE|NEON|AUTH|BLOB|RESEND|EMAIL)/.test(combinedServer)) errors.push(backendRepairError("Backend credentials cannot use NEXT_PUBLIC_ environment variables."))
  const dependencies = parsePackage(files["package.json"])
  const requiredDependencies = requiredBackendDependencies(capabilities)
  for (const dependency of requiredDependencies) if (!dependencies[dependency]) errors.push(backendRepairError(`Missing backend dependency: ${dependency}`))
  if (capabilities.includes("database")) {
    const db = files["lib/server/db.ts"] || ""; const schema = files["sql/schema.sql"] || ""; const migration = files["sql/migrations/001_initial.sql"] || ""; const runner = files["scripts/migrate.mjs"] || ""
    if (!hasLazyNeonGetter(db, env)) errors.push(backendRepairError("Neon connection must use a lazy getDb/getSql function without Proxy."))
    if (!/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?/i.test(schema) || !/\bTIMESTAMPTZ\b/i.test(schema) || !/\bCREATE\s+(?:UNIQUE\s+)?INDEX\b/i.test(schema)) errors.push(backendRepairError("Neon schema must include tables, TIMESTAMPTZ columns and indexes."))
    if (!/CREATE\s+TABLE/i.test(migration) || !/IF\s+NOT\s+EXISTS/i.test(migration)) errors.push(backendRepairError("Initial database migration must be repeatable and create the required tables."))
    if (!/@neondatabase\/serverless/.test(runner) || !/DATABASE_URL/.test(runner) || !/001_initial\.sql/.test(runner)) errors.push(backendRepairError("Migration runner must apply 001_initial.sql through DATABASE_URL."))
  }
  if (capabilities.includes("authentication")) {
    const auth = files["lib/server/auth.ts"] || ""; const schema = files["sql/schema.sql"] || ""; const migration = files["sql/migrations/001_initial.sql"] || ""
    for (const table of AUTH_TABLE_NAMES) {
      if (!hasSqlTable(schema, table)) errors.push(backendRepairError(`Authentication schema is missing ${table}.`))
      if (!hasSqlTable(migration, table)) errors.push(backendRepairError(`Authentication migration is missing ${table}.`))
    }
    if (!hasSecurePasswordAndJoseAuth(files)) errors.push(backendRepairError("Authentication must hash passwords and sign/verify sessions with bcryptjs and jose."))
    if (!/\bAUTH_SECRET\b/.test(auth) || /AUTH_SECRET[^\n]*(?:\|\||\?\?)\s*["']/.test(auth)) errors.push(backendRepairError("Authentication must require AUTH_SECRET without a hard-coded fallback."))
    const cookieSource = [files["app/api/auth/login/route.ts"], files["app/api/auth/logout/route.ts"], auth].join("\n")
    if (!/httpOnly\s*:\s*true/.test(cookieSource) || !/sameSite\s*:[^,\n}]*(?:["'](?:lax|strict)["'])/.test(cookieSource) || !/secure\s*:/.test(cookieSource)) errors.push(backendRepairError("Authentication session cookie must be HttpOnly, SameSite and Secure in production."))
    const forgot = files["app/api/auth/forgot-password/route.ts"] || ""
    if (!/send|email/i.test(forgot) || /user not found|email does not exist/i.test(forgot)) errors.push(backendRepairError("Forgot-password must send a neutral email response without account enumeration."))
  }
  if (capabilities.includes("storage")) {
    const upload = files["app/api/uploads/route.ts"] || ""; const item = files["app/api/uploads/[id]/route.ts"] || ""
    if (!/@vercel\/blob/.test(`${upload}\n${item}`) || !/access\s*:\s*["']private["']/.test(upload)) errors.push(backendRepairError("File uploads must use private Vercel Blob storage."))
    if (!hasGuard(upload) || !hasGuard(item) || !/(?:size|MAX_FILE)/.test(upload) || !/(?:type|mime|contentType)/i.test(upload)) errors.push(backendRepairError("Upload APIs must authenticate and validate file size and MIME type."))
    if (!hasAuthenticatedBlobPathScope(upload)) errors.push(backendRepairError("Blob paths must be scoped to the authenticated owner or tenant."))
  }
  if (capabilities.includes("email")) {
    const email = files["lib/server/email.ts"] || ""; const emailRoute = files["app/api/email/route.ts"] || ""
    if (!/import\s+["']server-only["']/.test(email) || !/\bResend\b/.test(email) || !/\bRESEND_API_KEY\b/.test(email) || !/\bEMAIL_FROM\b/.test(email) || !/idempotency/i.test(email)) errors.push(backendRepairError("Email service must be server-only Resend with validated sender, key and idempotency."))
    if (!/\bz\.(?:object|string)\b/.test(emailRoute) || (!hasGuard(emailRoute) && !/(?:rateLimit|rate_limit|captcha|turnstile)\s*\(/i.test(emailRoute))) errors.push(backendRepairError("Email API must validate input and enforce authentication or persistent abuse protection."))
  }
  if (capabilities.includes("api")) {
    const requiresAuthentication = capabilities.includes("authentication")
    for (const resource of backendApiResources(specification)) {
      const collection = files[`app/api/${resource}/route.ts`] || ""; const item = files[`app/api/${resource}/[id]/route.ts`] || ""
      if (requiresAuthentication && (!hasGuard(collection) || !hasGuard(item))) errors.push(backendRepairError(`API resource ${resource} must authenticate and enforce ownership.`))
      if (!hasZodValidation(`${collection}\n${item}`)) errors.push(backendRepairError(`API resource ${resource} must validate input with Zod.`))
      if (!hasRouteMethod(collection, "GET") || !hasRouteMethod(collection, "POST") || !hasRouteMethod(item, "GET") || !hasRouteMethod(item, "PATCH") || !hasRouteMethod(item, "DELETE")) errors.push(backendRepairError(`Backend CRUD API is incomplete: ${resource}`))
    }
  }
  if (!/DATABASE_URL|RESEND_API_KEY|BLOB_READ_WRITE_TOKEN|AUTH_SECRET/.test(files["docs/backend-setup.md"] || "")) warnings.push("Backend setup documentation should list every required environment variable name.")
  return { valid: errors.length === 0, errors: unique(errors), warnings: unique(warnings) }
}
