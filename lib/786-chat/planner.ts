import type { ProjectSpecification } from "./specification"
import { backendCapabilities, requiredBackendFiles } from "./backend-capabilities"

export type ProjectPlan = {
  files: Array<{ path: string; purpose: string }>
  steps: string[]
  acceptanceCriteria: string[]
}

function routeFile(route: string) {
  return route === "/" ? "app/page.tsx" : `app${route}/page.tsx`
}

export function createProjectPlan(specification: ProjectSpecification): ProjectPlan {
  const capabilities = backendCapabilities(specification)
  const mobileFiles = specification.platforms.includes("mobile")
    ? [
        { path: "mobile/package.json", purpose: "Expo mobile dependencies and scripts" },
        { path: "mobile/app.json", purpose: "Expo application configuration" },
        { path: "mobile/app/index.tsx", purpose: "Touch-first mobile application entry screen" },
        { path: "mobile/services/api.ts", purpose: "Shared authenticated API client boundary" },
      ]
    : []
  const systemFiles = specification.systemBlueprint
    ? [
        { path: "shared/contracts.ts", purpose: "Shared typed system and API contracts" },
        { path: "lib/server/tenant.ts", purpose: "Authenticated tenant and role enforcement" },
        { path: "lib/server/validation.ts", purpose: "Server-side input validation" },
        { path: "sql/schema.sql", purpose: "Neon/PostgreSQL relational schema and tenant indexes" },
        ...specification.systemBlueprint.apiResources.map((resource) => ({
          path: `app/api/${resource}/route.ts`,
          purpose: `Tenant-scoped ${resource} collection API (GET and POST)`,
        })),
        ...specification.systemBlueprint.apiResources.map((resource) => ({
          path: `app/api/${resource}/[id]/route.ts`,
          purpose: `Tenant-scoped ${resource} item API (GET, PATCH and DELETE)`,
        })),
      ]
    : []
  const systemFilePaths = new Set(systemFiles.map((file) => file.path))
  const backendFiles = requiredBackendFiles(specification)
    .filter((path) => !systemFilePaths.has(path))
    .map((path) => ({
      path,
      purpose: `Production ${capabilities.join("/")} backend implementation`,
    }))

  // Backend files deliberately come before page files. Provider responses can be
  // truncated on large full-stack requests, so schema, manifest, server adapters
  // and API routes must be emitted before cosmetic/frontend work. Validation then
  // has the mandatory backend artifacts even when a provider reaches its output cap.
  const files = [
    { path: "package.json", purpose: "Allowed dependencies and build scripts" },
    { path: "tsconfig.json", purpose: "TypeScript compiler configuration" },
    { path: "next.config.mjs", purpose: "Next.js runtime configuration" },
    ...backendFiles,
    ...systemFiles,
    { path: "app/layout.tsx", purpose: "Application shell and metadata" },
    { path: "app/globals.css", purpose: "Project-specific design system and responsive styles" },
    ...specification.routes.map((route) => ({
      path: routeFile(route),
      purpose: `${route} route`,
    })),
    ...mobileFiles,
  ]

  const requiresAuthentication = capabilities.includes("authentication")

  return {
    files,
    steps: [
      ...(capabilities.length > 0
        ? [
            "Generate every mandatory backend file before any cosmetic or frontend rewrite",
            "Implement database schema, migrations, manifest, server adapters and requested API routes",
          ]
        : []),
      "Create the application shell and design tokens",
      "Implement every requested route",
      "Add required controls and interactions",
      "Connect navigation only to existing routes",
      "Validate syntax, imports, requirements and project specificity",
      "Build the project in the isolated runner",
      ...(capabilities.length > 0
        ? ["Validate every declared backend capability through real server routes and provider adapters"]
        : []),
      ...(specification.systemBlueprint
        ? [
            "Create the tenant-safe relational schema and contracts",
            "Implement each core workflow through UI, API and persistence boundaries",
            "Document external provider and hardware adapters without pretending they are connected",
          ]
        : []),
      ...(specification.platforms.includes("mobile")
        ? ["Generate the Expo mobile client against shared authenticated API contracts"]
        : []),
    ],
    acceptanceCriteria: [
      ...specification.routes.map((route) => `Route ${route} exists`),
      ...specification.requiredComponents.map((component) => `Component ${component} exists`),
      ...specification.requiredInteractions.map((interaction) => `Interaction ${interaction} is implemented`),
      "Project content is specific to the request",
      "No generic fallback homepage is accepted as a verified build",
      ...(capabilities.length > 0
        ? [
            "Backend manifest, migrations, server adapters and API routes pass production acceptance",
            requiresAuthentication
              ? "Authentication routes and protected data APIs are complete before frontend acceptance"
              : "Public data APIs remain functional without inventing authentication dependencies",
          ]
        : []),
      ...(specification.systemBlueprint
        ? [
            "Tenant-owned records and APIs enforce company_id",
            "Operational modules are implemented as application pages, not marketing sections",
            "Database schema, shared contracts and core API resources exist",
          ]
        : []),
      ...(specification.platforms.includes("mobile")
        ? ["Expo app, configuration and mobile API service exist with touch-first navigation"]
        : []),
    ],
  }
}
