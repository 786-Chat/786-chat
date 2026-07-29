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
  const files = [
    { path: "package.json", purpose: "Allowed dependencies and build scripts" },
    { path: "tsconfig.json", purpose: "TypeScript compiler configuration" },
    { path: "next.config.ts", purpose: "Next.js runtime configuration" },
    { path: "app/layout.tsx", purpose: "Application shell and metadata" },
    { path: "app/globals.css", purpose: "Project-specific design system and responsive styles" },
    ...specification.routes.map((route) => ({
      path: routeFile(route),
      purpose: `${route} route`,
    })),
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
    ],
    acceptanceCriteria: [
      ...specification.routes.map((route) => `Route ${route} exists`),
      ...specification.requiredComponents.map((component) => `Component ${component} exists`),
      ...specification.requiredInteractions.map((interaction) => `Interaction ${interaction} is implemented`),
      "Project content is specific to the request",
      "No generic fallback homepage is accepted as a verified build",
    ],
  }
}
