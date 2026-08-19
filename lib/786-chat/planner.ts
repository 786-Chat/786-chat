import type { ProjectSpecification } from "./specification"
import { backendApiResources, backendCapabilities, requiredBackendFiles } from "./backend-capabilities"

export type ProjectPlan = {
  files: Array<{ path: string; purpose: string }>
  steps: string[]
  acceptanceCriteria: string[]
}

const NON_CRUD_APPLICATION_ROUTES = new Set([
  "about", "blog", "booking", "checkout", "contact", "dashboard", "faq", "gallery",
  "login", "pricing", "profile", "register", "reports", "services", "settings",
])

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
  if (path === "lib/server/auth.ts" && capabilities.includes("authentication")) {
    return "Production authentication backend using bcryptjs hash/compare for passwords, jose SignJWT/jwtVerify for signed sessions, AUTH_SECRET with no fallback, secure session helpers, and token hashing/revocation"
  }
  if (path === "app/api/auth/register/route.ts" && capabilities.includes("authentication")) {
    return "Registration API that validates input, hashes passwords through lib/server/auth.ts, persists the user safely, and never stores plaintext passwords"
  }
  if (path === "app/api/auth/login/route.ts" && capabilities.includes("authentication")) {
    return "Login API that validates input, compares bcrypt password hashes, creates a signed jose-backed session, and sets a secure HttpOnly cookie"
  }
  if (path === "app/api/auth/session/route.ts" && capabilities.includes("authentication")) {
    return "Session API that verifies the current jose-backed signed session through lib/server/auth.ts and returns only authenticated user-safe data"
  }
  if (path === "app/api/auth/logout/route.ts" && capabilities.includes("authentication")) {
    return "Logout API that revokes/purges the persisted session and clears the secure cookie"
  }
  if (path === "app/api/auth/forgot-password/route.ts" && capabilities.includes("authentication")) {
    return "Forgot-password API that creates a hashed one-time reset token, sends a neutral response, and prevents account enumeration"
  }
  if (path === "app/api/auth/reset-password/route.ts" && capabilities.includes("authentication")) {
    return "Reset-password API that validates the one-time token, hashes the new password with bcryptjs, revokes existing sessions, and invalidates the reset token"
  }
  if (path === "app/api/auth/verify-email/route.ts" && capabilities.includes("authentication")) {
    return "Email verification API that validates a hashed one-time verification token and marks the user verified without exposing token material"
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

export function createProjectPlan(specification: ProjectSpecification): ProjectPlan {
  const capabilities = backendCapabilities(specification)
  const mobileFiles = specification.platforms.includes("mobile") ? [
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
  const backendFiles = requiredBackendFiles(specification)
    .filter((path) => !systemFilePaths.has(path))
    .map((path) => ({ path, purpose: backendFilePurpose(path, capabilities) }))
  const crudFiles = crudApplicationFiles(specification)
  const authFiles = authSupportFiles(specification)
  const files = [
    { path: "package.json", purpose: "Allowed dependencies and build scripts" },
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
      ...(capabilities.length > 0 ? ["Generate every mandatory backend file before any cosmetic or frontend rewrite", "Implement database schema, migrations, manifest, server adapters and requested API routes"] : []),
      ...(requiresAuthentication ? ["Implement lib/server/auth.ts first with bcryptjs hash/compare and jose SignJWT/jwtVerify using AUTH_SECRET, then make every auth route call those shared helpers instead of inventing incompatible local auth logic"] : []),
      "Create the application shell and design tokens", "Implement every requested route",
      ...(authFiles.length > 0 ? ["Implement forgot-password, reset-password and verify-email support pages before linking to them from authentication UI"] : []),
      ...(requiresAuthentication && specification.routes.includes("/login") ? ["Login page must include a visible real link to /forgot-password with Forgot Password text; plain text or a non-link control does not satisfy this requirement"] : []),
      ...(specification.requiredComponents.includes("form") ? ["Implement required forms as real <form> elements with submit handling; styled divs or button groups do not satisfy form requirements"] : []),
      ...(crudFiles.length > 0 ? ["Implement create and detail/edit pages for CRUD application resources"] : []),
      "Add required controls and interactions", "Connect navigation only to existing routes", "Validate syntax, imports, requirements and project specificity", "Build the project in the isolated runner",
      ...(capabilities.length > 0 ? ["Validate every declared backend capability through real server routes and provider adapters"] : []),
      ...(specification.systemBlueprint ? ["Create the tenant-safe relational schema and contracts", "Implement each core workflow through UI, API and persistence boundaries", "Document external provider and hardware adapters without pretending they are connected"] : []),
      ...(specification.platforms.includes("mobile") ? ["Generate the Expo mobile client against shared authenticated API contracts"] : []),
    ],
    acceptanceCriteria: [
      ...specification.routes.map((route) => `Route ${route} exists`), ...authFiles.map((file) => `Route file ${file.path} exists`), ...crudFiles.map((file) => `Route file ${file.path} exists`),
      ...specification.requiredComponents.map((component) => `Component ${component} exists`), ...specification.requiredInteractions.map((interaction) => `Interaction ${interaction} is implemented`),
      ...(requiresAuthentication ? ["lib/server/auth.ts imports bcryptjs and jose, hashes/compares passwords, signs/verifies sessions, and requires AUTH_SECRET without a hard-coded fallback"] : []),
      ...(requiresAuthentication && specification.routes.includes("/login") ? ["Login page contains a real /forgot-password link with visible Forgot Password text"] : []),
      "Project content is specific to the request", "No generic fallback homepage is accepted as a verified build",
      ...(capabilities.length > 0 ? ["Backend manifest, migrations, server adapters and API routes pass production acceptance", requiresAuthentication ? "Authentication routes and protected data APIs are complete before frontend acceptance" : "Public data APIs remain functional without inventing authentication dependencies"] : []),
      ...(specification.systemBlueprint ? ["Tenant-owned records and APIs enforce company_id", "Operational modules are implemented as application pages, not marketing sections", "Database schema, shared contracts and core API resources exist"] : []),
      ...(specification.platforms.includes("mobile") ? ["Expo app, configuration and mobile API service exist with touch-first navigation"] : []),
    ],
  }
}