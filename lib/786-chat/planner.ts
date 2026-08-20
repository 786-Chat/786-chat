import type { ProjectSpecification } from "./specification"
import { backendApiResources, backendCapabilities, requiredBackendFiles } from "./backend-capabilities"

export type ProjectPlan = {
  files: Array<{ path: string; purpose: string }>
  steps: string[]
  acceptanceCriteria: string[]
}

const NON_CRUD_APPLICATION_ROUTES = new Set([
  "about", "blog", "booking", "checkout", "contact", "dashboard", "faq", "gallery",
  "forgot-password", "login", "pricing", "profile", "register", "reports", "reset-password",
  "services", "settings", "verify-email",
])

const BACKEND_FOUNDATION_PRIORITY: Record<string, number> = {
  "backend/manifest.json": 0,
  "lib/server/env.ts": 1,
  "lib/server/db.ts": 2,
  "lib/server/auth.ts": 3,
  "lib/server/email.ts": 4,
  "sql/schema.sql": 5,
  "sql/migrations/001_initial.sql": 6,
  "scripts/migrate.mjs": 7,
  "docs/backend-setup.md": 8,
}

function routeFile(route: string) {
  return route === "/" ? "app/page.tsx" : `app${route}/page.tsx`
}

function routePurpose(route: string, specification: ProjectSpecification) {
  if (route === "/login" && specification.requiredComponents.includes("form")) {
    const authRequired = backendCapabilities(specification).includes("authentication")
    return authRequired
      ? "/login route with a real HTML form, email/password inputs, remember-me control, submit button, and a visible real link to /forgot-password with Forgot Password text"
      : "/login route with a real HTML form, email/password inputs, remember-me control and submit button"
  }
  if (route === "/register" && specification.requiredComponents.includes("form")) {
    return "/register route with a real HTML registration form and submit control"
  }
  return `${route} route`
}

function backendFilePurpose(path: string, capabilities: string[]) {
  if (path === "lib/server/env.ts") {
    return "Production server-only environment module validated with Zod. Export type Env, getEnv(): Env, and a lazy-compatible exported env accessor/value so sibling server modules cannot invent an incompatible env import. Require DATABASE_URL/AUTH_SECRET and selected provider variables without hard-coded secret fallbacks."
  }
  if (path === "lib/server/db.ts" && capabilities.includes("database")) {
    return "Production Neon Serverless adapter. Lazily create the Neon query function from DATABASE_URL and export BOTH getDb() and getSql (one may be an alias of the other). Never use node-postgres .connect(), .release(), result.rows, or a Proxy."
  }
  if (path === "lib/server/auth.ts" && capabilities.includes("authentication")) {
    return "Production shared authentication module. It MUST export hashPassword(password), verifyPassword(password, hash), signSession(payload): Promise<string>, verifySession(token), generateToken(), hashToken(token), getCurrentUser(), and requireUser(). signSession MUST return the signed JWT string and MUST NOT return void or a cookie object. Use bcryptjs hash/compare for passwords; jose SignJWT/jwtVerify for signed sessions; crypto.randomBytes for one-time reset/verification tokens; crypto.createHash('sha256') for stored token hashes; require AUTH_SECRET with no hard-coded fallback. Session/user objects must use stable fields userId, companyId when applicable, and email. Every auth/data route must import only helpers this module actually exports."
  }
  if (path === "lib/server/email.ts" && capabilities.includes("email")) {
    return "Production server-only Resend email module. MUST export sendEmail({to, subject, html, idempotencyKey}) returning a typed result with an `ok` boolean, AND sendPasswordResetEmail(email, token) implemented through sendEmail with a reset URL and deterministic idempotency key. Use RESEND_API_KEY and EMAIL_FROM only on the server."
  }
  if (path === "app/api/auth/register/route.ts" && capabilities.includes("authentication")) {
    return "Registration API using exported hashPassword and signSession from lib/server/auth.ts; validate input, persist the user safely, never store plaintext passwords, and set the JWT string directly as a secure HttpOnly cookie. Do not call createSession or access .cookie on a session string."
  }
  if (path === "app/api/auth/login/route.ts" && capabilities.includes("authentication")) {
    return "Login API using exported verifyPassword and signSession from lib/server/auth.ts. Await signSession(payload) to get a JWT string, then set that string directly as the secure HttpOnly session cookie on NextResponse. Do NOT call createSession and do NOT access session.cookie or token.cookie."
  }
  if (path === "app/api/auth/session/route.ts" && capabilities.includes("authentication")) {
    return "Session API reading the session cookie and using exported verifySession/getCurrentUser from lib/server/auth.ts; return only authenticated user-safe fields userId, companyId when applicable, and email. Do not access a nonexistent session.user wrapper."
  }
  if (path === "app/api/auth/logout/route.ts" && capabilities.includes("authentication")) {
    return "Logout API that revokes/purges the persisted session when available and always clears the secure cookie; use the stable userId/companyId/email session contract and import only helpers actually exported by lib/server/auth.ts."
  }
  if (path === "app/api/auth/forgot-password/route.ts" && capabilities.includes("authentication")) {
    return "Forgot-password API using exported generateToken and hashToken from lib/server/auth.ts plus exported sendPasswordResetEmail(email, token) from lib/server/email.ts. Store only the token hash, send a neutral response, and prevent account enumeration."
  }
  if (path === "app/api/auth/reset-password/route.ts" && capabilities.includes("authentication")) {
    return "Reset-password API using ONLY canonical exported hashToken and hashPassword from lib/server/auth.ts plus getDb/getSql. Validate the one-time token directly against password_reset_tokens, hash the new password, revoke existing sessions, and invalidate the reset token. Do not invent verifyPasswordResetToken/invalidatePasswordResetToken/invalidateUserSessions helpers unless they physically exist in lib/server/auth.ts."
  }
  if (path === "app/api/auth/verify-email/route.ts" && capabilities.includes("authentication")) {
    return "Email verification API using exported hashToken from lib/server/auth.ts and getDb/getSql; validate a hashed one-time verification token and mark the user verified without exposing token material."
  }
  if (path === "app/api/email/route.ts" && capabilities.includes("email")) {
    return "Authenticated email API using exported requireUser/getCurrentUser and sendEmail. Always supply idempotencyKey and check the returned `ok` boolean; do not invent result.success."
  }
  return `Production ${capabilities.join("/")} backend implementation`
}

function crudApplicationFiles(specification: ProjectSpecification) {
  const routeSet = new Set(specification.routes)
  const capabilities = backendCapabilities(specification)
  const resources = new Set(backendApiResources(specification))
  if (capabilities.includes("api")) {
    for (const route of specification.routes) {
      const match = route.match(/^\/([a-z0-9][a-z0-9_-]*)$/i)
      const resource = match?.[1]?.toLowerCase()
      if (!resource || NON_CRUD_APPLICATION_ROUTES.has(resource)) continue
      resources.add(resource)
    }
  }
  return Array.from(resources).flatMap((resource) => {
    const route = `/${resource}`
    if (!routeSet.has(route)) return []
    return [
      { path: `app/${resource}/new/page.tsx`, purpose: `${route}/new create workflow route with a real HTML form and submit handling` },
      { path: `app/${resource}/[id]/page.tsx`, purpose: `${route}/[id] detail and edit workflow route with a real edit form and submit handling` },
    ]
  })
}

function authSupportFiles(specification: ProjectSpecification) {
  const capabilities = backendCapabilities(specification)
  if (!capabilities.includes("authentication")) return []
  const routeSet = new Set(specification.routes)
  return [
    !routeSet.has("/forgot-password")
      ? { path: "app/forgot-password/page.tsx", purpose: "Forgot-password route with a real email form and submit handling" }
      : null,
    !routeSet.has("/reset-password")
      ? { path: "app/reset-password/page.tsx", purpose: "Reset-password route with a real password form and submit handling" }
      : null,
    !routeSet.has("/verify-email")
      ? { path: "app/verify-email/page.tsx", purpose: "Email-verification status route with a real verification action" }
      : null,
  ].filter((file): file is { path: string; purpose: string } => Boolean(file))
}

function sortBackendFiles(paths: string[]) {
  return [...paths].sort((left, right) => {
    const leftPriority = BACKEND_FOUNDATION_PRIORITY[left]
    const rightPriority = BACKEND_FOUNDATION_PRIORITY[right]
    const leftFoundation = leftPriority !== undefined
    const rightFoundation = rightPriority !== undefined
    if (leftFoundation && rightFoundation) return leftPriority - rightPriority
    if (leftFoundation) return -1
    if (rightFoundation) return 1
    return left.localeCompare(right)
  })
}

export function createProjectPlan(specification: ProjectSpecification): ProjectPlan {
  const capabilities = backendCapabilities(specification)
  const standaloneMobile = specification.platforms.includes("mobile") && specification.projectType === "mobile-application"
  const mobileFiles = standaloneMobile ? [
    { path: "mobile/package.json", purpose: "Expo mobile dependencies and scripts" },
    { path: "mobile/app.json", purpose: "Expo application configuration" },
    { path: "mobile/app/index.tsx", purpose: "Touch-first mobile application entry screen" },
    { path: "mobile/services/api.ts", purpose: "Shared authenticated API client boundary" },
  ] : []
  const systemFiles = specification.systemBlueprint ? [
    { path: "shared/contracts.ts", purpose: "Shared typed system and API contracts" },
    { path: "lib/server/tenant.ts", purpose: "Authenticated tenant and role enforcement" },
    { path: "lib/server/validation.ts", purpose: "Server-side input validation" },
    { path: "sql/schema.sql", purpose: "Neon/PostgreSQL relational schema and tenant indexes" },
    ...specification.systemBlueprint.apiResources.map((resource) => ({ path: `app/api/${resource}/route.ts`, purpose: `Tenant-scoped ${resource} collection API (GET and POST)` })),
    ...specification.systemBlueprint.apiResources.map((resource) => ({ path: `app/api/${resource}/[id]/route.ts`, purpose: `Tenant-scoped ${resource} item API (GET, PATCH and DELETE)` })),
  ] : []
  const systemFilePaths = new Set(systemFiles.map((file) => file.path))
  const backendFiles = sortBackendFiles(requiredBackendFiles(specification).filter((path) => !systemFilePaths.has(path)))
    .map((path) => ({ path, purpose: backendFilePurpose(path, capabilities) }))
  const crudFiles = crudApplicationFiles(specification)
  const authFiles = authSupportFiles(specification)
  const files = [
    { path: "package.json", purpose: "Allowed dependencies and build scripts. Include every external package actually imported by generated files and do not import packages that are absent here." },
    { path: "tsconfig.json", purpose: "TypeScript compiler configuration" },
    { path: "next.config.mjs", purpose: "Next.js runtime configuration" },
    ...backendFiles, ...systemFiles,
    { path: "app/layout.tsx", purpose: "Application shell and metadata" },
    { path: "app/globals.css", purpose: "Project-specific design system and responsive styles" },
    ...specification.routes.map((route) => ({ path: routeFile(route), purpose: routePurpose(route, specification) })),
    ...authFiles, ...crudFiles, ...mobileFiles,
  ]
  const requiresAuthentication = capabilities.includes("authentication")
  return {
    files,
    steps: [
      ...(capabilities.length > 0 ? ["Generate foundation contracts (env, db, auth, email) before any route that imports them", "Implement database schema, migrations, manifest, server adapters and requested API routes"] : []),
      ...(requiresAuthentication ? ["Implement lib/server/auth.ts first with the exact shared exports hashPassword, verifyPassword, signSession, verifySession, generateToken, hashToken, getCurrentUser and requireUser. signSession(payload) must return Promise<string> containing the signed JWT. The login/register routes must set that JWT directly as the secure HttpOnly cookie and must never access .cookie on the signSession result. Then make every auth route import only those exported helpers. Use bcryptjs for passwords, jose with AUTH_SECRET for sessions, and crypto for one-time tokens."] : []),
      ...(capabilities.includes("email") ? ["Implement lib/server/email.ts before forgot-password and email API routes; export sendEmail and sendPasswordResetEmail with one consistent typed result contract"] : []),
      "Create the application shell and design tokens", "Implement every requested route",
      ...(authFiles.length > 0 ? ["Implement forgot-password, reset-password and verify-email support pages before linking to them from authentication UI"] : []),
      ...(requiresAuthentication && specification.routes.includes("/login") ? ["Login page must include a visible real link to /forgot-password with Forgot Password text; plain text or a non-link control does not satisfy this requirement"] : []),
      ...(specification.requiredComponents.includes("form") ? ["Implement required forms as real <form> elements with submit handling; styled divs or button groups do not satisfy form requirements"] : []),
      ...(crudFiles.length > 0 ? ["Implement create and detail/edit pages only for actual CRUD business resources"] : []),
      "Do not import unplanned local components/helpers or packages that do not physically exist", "Add required controls and interactions", "Connect navigation only to existing routes", "Validate syntax, imports, requirements and project specificity", "Run TypeScript and the production build in the isolated runner",
      ...(capabilities.length > 0 ? ["Validate every declared backend capability through real server routes and provider adapters"] : []),
      ...(specification.systemBlueprint ? ["Create the tenant-safe relational schema and contracts", "Implement each core workflow through UI, API and persistence boundaries", "Document external provider and hardware adapters without pretending they are connected"] : []),
      ...(standaloneMobile ? ["Generate the Expo mobile client against shared authenticated API contracts"] : []),
    ],
    acceptanceCriteria: [
      ...specification.routes.map((route) => `Route ${route} exists`), ...authFiles.map((file) => `Route file ${file.path} exists`), ...crudFiles.map((file) => `Route file ${file.path} exists`),
      ...specification.requiredComponents.map((component) => `Component ${component} exists`), ...specification.requiredInteractions.map((interaction) => `Interaction ${interaction} is implemented`),
      ...(requiresAuthentication ? ["lib/server/auth.ts imports bcryptjs and jose; exports hashPassword, verifyPassword, signSession, verifySession, generateToken, hashToken, getCurrentUser and requireUser; signSession returns a signed JWT string rather than void or a cookie object; login/register set that JWT directly as the secure HttpOnly cookie without accessing .cookie; passwords and sessions use the required crypto; AUTH_SECRET has no hard-coded fallback; and every app/api/auth route imports only helpers actually exported by lib/server/auth.ts"] : []),
      ...(capabilities.includes("email") ? ["lib/server/email.ts exports sendEmail and sendPasswordResetEmail; forgot-password imports the real reset helper; email callers supply idempotencyKey and use the typed `ok` result"] : []),
      ...(requiresAuthentication && specification.routes.includes("/login") ? ["Login page contains a real /forgot-password link with visible Forgot Password text"] : []),
      "Every local import resolves to a generated file and every external import exists in package.json", "Project content is specific to the request", "No generic fallback homepage is accepted as a verified build",
      ...(capabilities.length > 0 ? ["Backend manifest, migrations, server adapters and API routes pass production acceptance", requiresAuthentication ? "Authentication routes and protected data APIs are complete before frontend acceptance" : "Public data APIs remain functional without inventing authentication dependencies"] : []),
      ...(specification.systemBlueprint ? ["Tenant-owned records and APIs enforce company_id", "Operational modules are implemented as application pages, not marketing sections", "Database schema, shared contracts and core API resources exist"] : []),
      ...(standaloneMobile ? ["Expo app, configuration and mobile API service exist with touch-first navigation"] : []),
    ],
  }
}