export type SystemBlueprint = {
  id: string
  name: string
  aliases: string[]
  routes: string[]
  modules: string[]
  entities: string[]
  roles: string[]
  workflows: string[]
  apiResources: string[]
  integrations: string[]
  tenantScoped: boolean
}

const blueprint = (value: SystemBlueprint) => value

export const SYSTEM_BLUEPRINTS: readonly SystemBlueprint[] = [
  blueprint({
    id: "crm",
    name: "CRM",
    aliases: ["crm", "customer relationship management", "sales pipeline"],
    routes: ["/dashboard", "/customers", "/pipeline", "/activities", "/reports"],
    modules: ["customer-360", "sales-pipeline", "activities", "tasks", "reporting"],
    entities: ["companies", "users", "customers", "contacts", "opportunities", "activities", "tasks", "audit_logs"],
    roles: ["company-owner", "sales-manager", "sales-agent", "read-only-auditor"],
    workflows: ["lead-capture-to-customer", "lead-to-opportunity", "opportunity-stage-change", "sales-follow-up-notification", "booking-to-sale", "campaign-conversion-attribution", "customer-history"],
    apiResources: ["customers", "opportunities", "activities"],
    integrations: ["email-adapter", "csv-import-export"],
    tenantScoped: true,
  }),
  blueprint({
    id: "erp",
    name: "ERP",
    aliases: ["erp", "enterprise resource planning"],
    routes: ["/dashboard", "/finance", "/procurement", "/inventory", "/operations", "/reports"],
    modules: ["finance", "procurement", "inventory", "operations", "approvals", "reporting"],
    entities: ["companies", "branches", "users", "accounts", "suppliers", "purchase_orders", "stock_items", "approvals", "audit_logs"],
    roles: ["company-owner", "administrator", "finance-manager", "operations-manager", "auditor"],
    workflows: ["purchase-to-pay", "approval-chain", "stock-receipt", "period-close"],
    apiResources: ["purchase-orders", "inventory", "approvals"],
    integrations: ["accounting-export", "csv-import-export"],
    tenantScoped: true,
  }),
  blueprint({
    id: "inventory",
    name: "Inventory Management",
    aliases: ["inventory system", "inventory management", "stock management", "warehouse management"],
    routes: ["/dashboard", "/inventory", "/suppliers", "/purchase-orders", "/warehouses", "/reports"],
    modules: ["catalogue", "stock-ledger", "warehouses", "suppliers", "purchasing", "reporting"],
    entities: ["companies", "branches", "users", "products", "stock_movements", "warehouses", "suppliers", "purchase_orders", "audit_logs"],
    roles: ["company-owner", "inventory-manager", "warehouse-worker", "purchasing-agent", "auditor"],
    workflows: ["goods-receipt", "stock-transfer", "stock-adjustment", "reorder", "cycle-count"],
    apiResources: ["inventory", "stock-movements", "purchase-orders"],
    integrations: ["barcode-qr-adapter", "csv-import-export"],
    tenantScoped: true,
  }),
  blueprint({
    id: "manufacturing",
    name: "Manufacturing Management",
    aliases: ["manufacturing system", "manufacturing", "factory management", "food production"],
    routes: ["/dashboard", "/production", "/batches", "/quality", "/inventory", "/maintenance", "/traceability", "/reports"],
    modules: ["production-planning", "recipes-bom", "batches", "quality", "inventory", "maintenance", "traceability", "recalls"],
    entities: ["companies", "factories", "users", "products", "materials", "suppliers", "recipes", "bom_items", "production_runs", "batches", "quality_checks", "stock_movements", "machines", "maintenance_jobs", "audit_logs"],
    roles: ["platform-owner", "company-owner", "factory-manager", "quality-manager", "production-worker", "maintenance-technician", "auditor"],
    workflows: ["supplier-receipt-to-batch", "plan-to-production-run", "quality-release-or-hold", "temperature-hygiene-allergen-check", "batch-to-warehouse-dispatch", "recall-trace", "downtime-maintenance-and-wastage"],
    apiResources: ["production-runs", "batches", "quality-checks", "inventory", "maintenance-jobs"],
    integrations: ["barcode-qr-adapter", "temperature-sensor-adapter", "csv-pdf-export"],
    tenantScoped: true,
  }),
  blueprint({
    id: "school",
    name: "School Management",
    aliases: ["school management", "student management", "education management"],
    routes: ["/dashboard", "/students", "/classes", "/attendance", "/timetable", "/fees", "/reports"],
    modules: ["students", "guardians", "staff", "classes", "attendance", "timetable", "assignments", "fees", "reporting"],
    entities: ["companies", "branches", "users", "students", "guardians", "teachers", "classes", "enrolments", "attendance", "assignments", "fees", "audit_logs"],
    roles: ["school-owner", "administrator", "teacher", "finance-staff", "guardian", "student", "auditor"],
    workflows: ["student-enrolment", "daily-attendance", "assignment-and-result", "fee-invoice-and-payment"],
    apiResources: ["students", "classes", "attendance", "fees"],
    integrations: ["email-notification-adapter", "csv-pdf-export"],
    tenantScoped: true,
  }),
  blueprint({
    id: "hospital",
    name: "Hospital Management",
    aliases: ["hospital management", "hospital system", "patient management"],
    routes: ["/dashboard", "/patients", "/appointments", "/clinical", "/wards", "/pharmacy", "/billing", "/reports"],
    modules: ["patients", "appointments", "clinical-records", "wards", "pharmacy", "billing", "reporting"],
    entities: ["companies", "branches", "users", "patients", "appointments", "encounters", "observations", "wards", "medications", "invoices", "audit_logs"],
    roles: ["hospital-owner", "administrator", "doctor", "nurse", "pharmacist", "billing-staff", "auditor"],
    workflows: ["patient-registration", "appointment-to-encounter", "clinical-observation", "prescription-dispense", "invoice-settlement"],
    apiResources: ["patients", "appointments", "encounters", "medications"],
    integrations: ["notification-adapter", "csv-pdf-export"],
    tenantScoped: true,
  }),
  blueprint({
    id: "restaurant-pos",
    name: "Restaurant POS",
    aliases: ["restaurant pos", "pos system", "point of sale", "restaurant point of sale"],
    routes: ["/dashboard", "/pos", "/orders", "/menu", "/kitchen", "/inventory", "/staff", "/reports"],
    modules: ["point-of-sale", "orders", "menu", "kitchen-display", "inventory", "staff", "reporting"],
    entities: ["companies", "branches", "users", "menu_categories", "menu_items", "orders", "order_items", "payments", "stock_items", "shifts", "audit_logs"],
    roles: ["restaurant-owner", "manager", "cashier", "kitchen-staff", "driver", "auditor"],
    workflows: ["order-to-kitchen", "kitchen-to-ready", "payment-and-receipt", "stock-consumption", "shift-close"],
    apiResources: ["orders", "menu", "kitchen", "inventory"],
    integrations: ["payment-adapter", "printer-adapter", "delivery-adapter"],
    tenantScoped: true,
  }),
  blueprint({
    id: "pest-control",
    name: "Pest Control Platform",
    aliases: ["pest control", "mouse control", "mouse trap", "pest sensor"],
    routes: ["/dashboard", "/customers", "/sites", "/devices", "/alerts", "/jobs", "/map", "/reports"],
    modules: ["customers", "sites", "device-registry", "telemetry", "alerts", "technician-jobs", "maintenance", "mapping", "reporting"],
    entities: ["companies", "branches", "users", "customers", "sites", "buildings", "rooms", "devices", "device_events", "alerts", "work_orders", "maintenance_logs", "audit_logs"],
    roles: ["platform-owner", "company-owner", "administrator", "technician", "customer", "auditor"],
    workflows: ["device-registration-and-qr-pairing", "mqtt-or-https-telemetry-to-alert", "battery-signal-online-status", "alert-acknowledgement", "technician-work-order-dispatch", "site-building-floor-room-location", "maintenance-history"],
    apiResources: ["devices", "telemetry", "alerts", "work-orders"],
    integrations: ["mqtt-adapter", "https-ingestion", "qr-pairing", "notification-adapter", "map-adapter"],
    tenantScoped: true,
  }),
  blueprint({
    id: "factory-monitoring",
    name: "Factory Monitoring",
    aliases: ["factory monitoring", "machine monitoring", "production monitoring"],
    routes: ["/dashboard", "/lines", "/machines", "/alerts", "/maintenance", "/analytics"],
    modules: ["line-monitoring", "machine-health", "telemetry", "alerts", "downtime", "maintenance", "analytics"],
    entities: ["companies", "factories", "users", "production_lines", "machines", "sensor_readings", "machine_events", "alerts", "downtime_events", "maintenance_jobs", "audit_logs"],
    roles: ["company-owner", "factory-manager", "line-supervisor", "maintenance-technician", "auditor"],
    workflows: ["telemetry-ingestion", "threshold-to-alert", "downtime-classification", "maintenance-dispatch"],
    apiResources: ["machines", "telemetry", "alerts", "maintenance-jobs"],
    integrations: ["mqtt-adapter", "https-ingestion", "notification-adapter"],
    tenantScoped: true,
  }),
  blueprint({
    id: "iot-dashboard",
    name: "IoT Dashboard",
    aliases: ["iot dashboard", "iot platform", "device platform", "sensor dashboard"],
    routes: ["/dashboard", "/devices", "/map", "/alerts", "/telemetry", "/gateways", "/reports"],
    modules: ["device-registry", "provisioning", "gateways", "telemetry", "alerts", "mapping", "firmware", "reporting"],
    entities: ["companies", "branches", "users", "devices", "device_credentials", "gateways", "telemetry", "device_events", "alerts", "firmware_releases", "audit_logs"],
    roles: ["platform-owner", "company-owner", "administrator", "technician", "customer", "auditor"],
    workflows: ["device-registration-and-qr-pairing", "gateway-pairing", "mqtt-or-https-telemetry-ingestion", "battery-signal-online-status", "alert-acknowledgement", "technician-work-order-dispatch", "site-building-floor-room-location", "firmware-rollout"],
    apiResources: ["devices", "gateways", "telemetry", "alerts"],
    integrations: ["mqtt-adapter", "https-ingestion", "bluetooth-gateway-boundary", "notification-adapter", "map-adapter"],
    tenantScoped: true,
  }),
] as const

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function hasCrmSalesIntent(prompt: string) {
  return /\b(?:sales\s+pipeline|sales\s+funnel|lead(?:s|\s+capture)?|opportunit(?:y|ies)|pipeline\s+stage|sales\s+stage|follow[-\s]?up|conversion|campaign\s+attribution|sales\s+notification)\b/i.test(prompt)
}

export function selectSystemBlueprint(prompt: string): SystemBlueprint | null {
  const request = normalize(prompt)
  const match = SYSTEM_BLUEPRINTS
    .flatMap((candidate) => candidate.aliases.map((alias) => ({
      candidate,
      alias: normalize(alias),
    })))
    .filter(({ candidate, alias }) =>
      request.includes(alias) && (candidate.id !== "crm" || hasCrmSalesIntent(prompt))
    )
    .sort((left, right) => right.alias.length - left.alias.length)[0]
  return match?.candidate || null
}

export function systemBlueprintBrief(value: SystemBlueprint): string[] {
  return [
    `System blueprint: ${value.name} (${value.id})`,
    `Required modules: ${value.modules.join(", ")}`,
    `Required routes: ${value.routes.join(", ")}`,
    `Relational entities: ${value.entities.join(", ")}`,
    `SQL schema rule: sql/schema.sql must CREATE TABLE for every relational entity listed above: ${value.entities.join(", ")}`,
    `Roles: ${value.roles.join(", ")}`,
    `End-to-end workflows: ${value.workflows.join(", ")}`,
    `API resources: ${value.apiResources.join(", ")}`,
    `Integration boundaries: ${value.integrations.join(", ")}`,
    value.tenantScoped
      ? "Tenant rule: every business record uses company_id and every server query enforces company ownership"
      : "Tenant rule: single-tenant",
    ...(value.tenantScoped
      ? ["Tenant SQL rule: sql/schema.sql must define companies, tenant-owned business tables must use company_id REFERENCES companies(id), and CREATE INDEX statements must include company_id."]
      : []),
    "Every tenant-scoped collection and item API route must reference companyId and invoke requireTenant, requireCompany, tenantGuard or assertTenant before every read or mutation.",
    "Every POST, PATCH and DELETE route validates input and persists a tenant-scoped audit_logs event; comments and labels are not implementations.",
    "Every required operational page contains a real form, table or state-changing interactive control using onSubmit, onClick, useState or a data mutation action.",
    ...(value.id === "crm"
      ? ["CRM workflow rule: implement an explicit sales follow-up task and notification in functional page or API code."]
      : []),
    "Generate real operational pages, route handlers, typed contracts, validation, PostgreSQL schema, loading/empty/error states and audit fields.",
    "Do not substitute marketing sections, static cards or pretend-live integrations for operational implementation.",
  ]
}
