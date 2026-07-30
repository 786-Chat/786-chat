import type { ProjectSpecification } from "./specification"

export type ProjectPlan = {
  files: Array<{ path: string; purpose: string }>
  steps: string[]
  acceptanceCriteria: string[]
}

function routeFile(route: string) {
  return route === "/" ? "app/page.tsx" : `app${route}/page.tsx`
}

export function createProjectPlan(specification: ProjectSpecification): ProjectPlan {
  const systemFiles = specification.systemBlueprint
    ? [
        { path: "shared/contracts.ts", purpose: "Shared typed system and API contracts" },
        { path: "lib/server/tenant.ts", purpose: "Authenticated tenant and role enforcement" },
        { path: "lib/server/validation.ts", purpose: "Server-side input validation" },
        { path: "sql/schema.sql", purpose: "Neon/PostgreSQL relational schema and tenant indexes" },
        ...specification.systemBlueprint.apiResources.map((resource) => ({
          path: `app/api/${resource}/route.ts`,
          purpose: `Tenant-scoped ${resource} API`,
        })),
      ]
    : []
  const files = [
    { path: "package.json", purpose: "Allowed dependencies and build scripts" },
    { path: "tsconfig.json", purpose: "TypeScript compiler configuration" },
    { path: "next.config.mjs", purpose: "Next.js runtime configuration" },
    { path: "app/layout.tsx", purpose: "Application shell and metadata" },
    { path: "app/globals.css", purpose: "Project-specific design system and responsive styles" },
    ...specification.routes.map((route) => ({
      path: routeFile(route),
      purpose: `${route} route`,
    })),
    ...systemFiles,
  ]

  return {
    files,
    steps: [
      "Create the application shell and design tokens",
      "Implement every requested route",
      "Add required controls and interactions",
      "Connect navigation only to existing routes",
      "Validate syntax, imports, requirements and project specificity",
      "Build the project in the isolated runner",
      ...(specification.systemBlueprint
        ? [
            "Create the tenant-safe relational schema and contracts",
            "Implement each core workflow through UI, API and persistence boundaries",
            "Document external provider and hardware adapters without pretending they are connected",
          ]
        : []),
    ],
    acceptanceCriteria: [
      ...specification.routes.map((route) => `Route ${route} exists`),
      ...specification.requiredComponents.map((component) => `Component ${component} exists`),
      ...specification.requiredInteractions.map((interaction) => `Interaction ${interaction} is implemented`),
      "Project content is specific to the request",
      "No generic fallback homepage is accepted as a verified build",
      ...(specification.systemBlueprint
        ? [
            "Tenant-owned records and APIs enforce company_id",
            "Operational modules are implemented as application pages, not marketing sections",
            "Database schema, shared contracts and core API resources exist",
          ]
        : []),
    ],
  }
}
