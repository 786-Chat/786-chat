export type DomainAcceptanceProfile = {
  blueprintIds: readonly string[]
  name: string
  requiredRoutes: readonly string[]
  evidenceGroups: readonly {
    label: string
    terms: readonly string[]
  }[]
  minimumOperationalPages: number
}

export type DomainAcceptanceResult = {
  valid: boolean
  errors: string[]
  checks: {
    routes: boolean
    workflows: boolean
    operationalPages: boolean
    stateTransitions: boolean
    apiAndSchema: boolean
  }
}

export const DOMAIN_ACCEPTANCE_PROFILES: readonly DomainAcceptanceProfile[] = [
  {
    blueprintIds: ["crm"],
    name: "CRM lead-to-conversion",
    requiredRoutes: ["/customers", "/pipeline", "/activities", "/reports"],
    evidenceGroups: [
      { label: "lead capture and persistence", terms: ["lead", "capture", "form", "customer"] },
      { label: "pipeline and opportunity stages", terms: ["pipeline", "opportunity", "stage", "status"] },
      { label: "follow-up and sales notification", terms: ["follow-up", "notification", "sales", "task"] },
      { label: "booking, sale and conversion attribution", terms: ["booking", "sale", "conversion", "campaign"] },
    ],
    minimumOperationalPages: 3,
  },
  {
    blueprintIds: ["manufacturing"],
    name: "Manufacturing traceability",
    requiredRoutes: ["/production", "/batches", "/quality", "/inventory", "/maintenance", "/traceability"],
    evidenceGroups: [
      { label: "bill of materials and production runs", terms: ["bom", "recipe", "material", "production"] },
      { label: "batch and lot tracking", terms: ["batch", "lot", "traceability", "supplier"] },
      { label: "quality release controls", terms: ["quality", "release", "hold", "inspection"] },
      { label: "food safety monitoring", terms: ["temperature", "hygiene", "allergen", "expiry"] },
      { label: "recall and dispatch trace", terms: ["recall", "dispatch", "warehouse", "barcode"] },
      { label: "maintenance and downtime", terms: ["maintenance", "downtime", "machine", "wastage"] },
    ],
    minimumOperationalPages: 4,
  },
  {
    blueprintIds: ["pest-control", "iot-dashboard"],
    name: "IoT device-to-technician",
    requiredRoutes: ["/devices", "/alerts", "/map", "/reports"],
    evidenceGroups: [
      { label: "device registration and pairing", terms: ["device", "registration", "pairing", "qr"] },
      { label: "telemetry ingestion transport", terms: ["telemetry", "mqtt", "https", "gateway"] },
      { label: "device health telemetry", terms: ["battery", "signal", "online", "offline"] },
      { label: "alert acknowledgement", terms: ["alert", "acknowledge", "status", "event"] },
      { label: "technician work orders", terms: ["technician", "work order", "maintenance", "assignment"] },
      { label: "physical location hierarchy", terms: ["site", "building", "floor", "room"] },
    ],
    minimumOperationalPages: 3,
  },
] as const

function routeFileCandidates(route: string) {
  const suffix = route === "/" ? "page" : `${route.slice(1)}/page`
  return [
    `app/${suffix}.tsx`,
    `app/${suffix}.ts`,
    `app/${suffix}.jsx`,
    `app/${suffix}.js`,
    `src/app/${suffix}.tsx`,
    `src/app/${suffix}.ts`,
    `src/app/${suffix}.jsx`,
    `src/app/${suffix}.js`,
  ]
}

function hasTerm(source: string, term: string) {
  const pattern = term
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/[\s_-]+/g, "[\\s_-]*")
  return new RegExp(`\\b${pattern}\\b`, "i").test(source)
}

function operationalPageCount(files: Record<string, string>) {
  return Object.entries(files).filter(([path, content]) =>
    /(?:^|\/)page\.(?:tsx?|jsx?)$/.test(path) &&
    /<(?:form|table|input|select|button)\b|onClick\s*=|onSubmit\s*=|useState\s*\(/i.test(content)
  ).length
}

export function assessDomainAcceptance(
  blueprintId: string,
  files: Record<string, string>,
): DomainAcceptanceResult {
  const profile = DOMAIN_ACCEPTANCE_PROFILES.find((candidate) =>
    candidate.blueprintIds.includes(blueprintId)
  )
  if (!profile) {
    return {
      valid: true,
      errors: [],
      checks: {
        routes: true,
        workflows: true,
        operationalPages: true,
        stateTransitions: true,
        apiAndSchema: true,
      },
    }
  }

  const errors: string[] = []
  const combined = Object.entries(files)
    .filter(([path]) => !/(?:rules|instructions|blueprint)\.(?:md|txt|ts)$/i.test(path))
    .map(([path, content]) => `/* ${path} */\n${content}`)
    .join("\n")

  const missingRoutes = profile.requiredRoutes.filter((route) =>
    !routeFileCandidates(route).some((path) => Boolean(files[path]?.trim()))
  )
  const routes = missingRoutes.length === 0
  if (!routes) {
    errors.push(`${profile.name} is missing operational routes: ${missingRoutes.join(", ")}`)
  }

  const missingWorkflows = profile.evidenceGroups.filter((group) =>
    !group.terms.every((term) => hasTerm(combined, term))
  )
  const workflows = missingWorkflows.length === 0
  if (!workflows) {
    errors.push(
      `${profile.name} is missing workflow evidence: ${missingWorkflows.map((group) => group.label).join(", ")}`,
    )
  }

  const pageCount = operationalPageCount(files)
  const operationalPages = pageCount >= profile.minimumOperationalPages
  if (!operationalPages) {
    errors.push(
      `${profile.name} requires at least ${profile.minimumOperationalPages} operational pages with forms, tables or interactive controls; found ${pageCount}.`,
    )
  }

  const stateTransitions =
    /\b(?:status|stage|state)\b/i.test(combined) &&
    /\b(?:transition|approve|acknowledge|assign|release|hold|dispatch|convert|PATCH)\b/i.test(combined)
  if (!stateTransitions) {
    errors.push(`${profile.name} does not implement a state-changing operational workflow.`)
  }

  const apiFiles = Object.keys(files).filter((path) => /app\/api\/.+\/route\.ts$/.test(path))
  const schema = files["sql/schema.sql"] || ""
  const apiAndSchema =
    apiFiles.length >= 2 &&
    /\bCREATE\s+TABLE\b/i.test(schema) &&
    /\bcompany_id\b/i.test(schema) &&
    /\b(?:POST|PATCH|DELETE)\b/.test(apiFiles.map((path) => files[path]).join("\n"))
  if (!apiAndSchema) {
    errors.push(`${profile.name} requires tenant-scoped schema and mutating API implementation.`)
  }

  return {
    valid: errors.length === 0,
    errors,
    checks: { routes, workflows, operationalPages, stateTransitions, apiAndSchema },
  }
}
