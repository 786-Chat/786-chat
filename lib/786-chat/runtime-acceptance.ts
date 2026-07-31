export type RuntimeAcceptanceCaseId = "crm" | "manufacturing" | "pest-iot"

export type RuntimeAcceptanceCase = {
  id: RuntimeAcceptanceCaseId
  title: string
  prompt: string
  expectedBlueprintId: string
  workflowStates: readonly string[]
  recordKinds: readonly string[]
}

export const RUNTIME_ACCEPTANCE_CASES: readonly RuntimeAcceptanceCase[] = [
  {
    id: "crm",
    title: "Runtime CRM Acceptance",
    expectedBlueprintId: "crm",
    workflowStates: ["captured", "qualified", "converted"],
    recordKinds: ["lead", "opportunity", "conversion"],
    prompt: [
      "Create a complete multi-company CRM called Runtime CRM Acceptance.",
      "Implement dashboard, customers, pipeline, activities and reports as operational pages.",
      "A lead capture form must save a tenant-owned lead, qualify it into an opportunity,",
      "create a salesperson follow-up notification, record a booking or sale, and attribute",
      "the final conversion to a campaign. Include real Neon schema, tenant-safe CRUD APIs,",
      "validation, audit events, loading, empty and error states. Build and verify every route.",
    ].join(" "),
  },
  {
    id: "manufacturing",
    title: "Runtime Manufacturing Acceptance",
    expectedBlueprintId: "manufacturing",
    workflowStates: ["planned", "quality_hold", "released"],
    recordKinds: ["production_run", "batch", "recall_trace"],
    prompt: [
      "Create a complete multi-company food manufacturing system called Runtime Manufacturing Acceptance.",
      "Implement production, batches, quality, inventory, maintenance, traceability and reports.",
      "Prove supplier receipt through BOM and production batch, temperature, hygiene, allergen and",
      "expiry inspection, quality hold or release, warehouse dispatch, barcode traceability, recall,",
      "machine downtime, maintenance and wastage. Include real Neon schema, tenant-safe CRUD APIs,",
      "validation, audit events and operational forms and tables. Build and verify every route.",
    ].join(" "),
  },
  {
    id: "pest-iot",
    title: "Runtime Pest IoT Acceptance",
    expectedBlueprintId: "pest-control",
    workflowStates: ["registered", "alerted", "technician_dispatched"],
    recordKinds: ["device", "telemetry_event", "work_order"],
    prompt: [
      "Create a complete multi-company pest control platform with smart IoT traps called Runtime Pest IoT Acceptance.",
      "Implement customers, sites, devices, alerts, jobs, map and reports as operational pages.",
      "Prove QR device registration, Wi-Fi or Bluetooth pairing, MQTT or HTTPS telemetry, battery,",
      "signal and online status, caught-event alert acknowledgement, site/building/floor/room location,",
      "technician assignment, work order and maintenance history. Include real Neon schema, tenant-safe",
      "CRUD and ingestion APIs, validation, audit events and operational controls. Build and verify every route.",
    ].join(" "),
  },
] as const

export function getRuntimeAcceptanceCase(
  value: unknown,
): RuntimeAcceptanceCase | null {
  const id = String(value || "").trim()
  return RUNTIME_ACCEPTANCE_CASES.find((candidate) => candidate.id === id) || null
}

export function runtimeAcceptanceMetadata(value: RuntimeAcceptanceCase) {
  return {
    runtimeAcceptance: {
      caseId: value.id,
      expectedBlueprintId: value.expectedBlueprintId,
      workflowStates: [...value.workflowStates],
      recordKinds: [...value.recordKinds],
      startedAt: new Date().toISOString(),
    },
  }
}
