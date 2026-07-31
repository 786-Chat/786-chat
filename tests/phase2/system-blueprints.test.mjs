import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("ten complete operational system blueprints are deterministic", async () => {
  const source = await read("lib/786-chat/system-blueprints.ts")
  assert.equal((source.match(/\bid: "[a-z0-9-]+"/g) || []).length, 10)
  for (const system of [
    "CRM",
    "ERP",
    "Inventory Management",
    "Manufacturing Management",
    "School Management",
    "Hospital Management",
    "Restaurant POS",
    "Pest Control Platform",
    "Factory Monitoring",
    "IoT Dashboard",
  ]) {
    assert.match(source, new RegExp(`name: "${system}"`))
  }
  for (const contract of [
    "routes",
    "modules",
    "entities",
    "roles",
    "workflows",
    "apiResources",
    "integrations",
    "tenantScoped",
  ]) {
    assert.match(source, new RegExp(`${contract}:`))
  }
  assert.match(source, /request\.includes\(alias\)/)
})

test("active generation receives system rules, schemas, APIs and workflows", async () => {
  const route = await read("app/api/786-chat/generate/route.ts")
  const planner = await read("lib/786-chat/planner.ts")
  const specification = await read("lib/786-chat/specification.ts")

  assert.match(route, /OPTIONAL_PROJECT_FEATURE_RULES/)
  assert.match(route, /systemBlueprintBrief/)
  assert.match(specification, /selectSystemBlueprint\(positivePrompt\)/)
  assert.match(planner, /sql\/schema\.sql/)
  assert.match(planner, /shared\/contracts\.ts/)
  assert.match(planner, /lib\/server\/tenant\.ts/)
  assert.match(planner, /app\/api\/\$\{resource\}\/route\.ts/)
})

test("system briefs require operational pages and explicit tenant API enforcement", async () => {
  const source = await read("lib/786-chat/system-blueprints.ts")
  assert.match(source, /collection and item API route must reference companyId/)
  assert.match(source, /persists a tenant-scoped audit_logs event/)
  assert.match(source, /operational page contains a real form, table or state-changing interactive control/)
  assert.match(source, /CRM workflow rule: implement an explicit sales follow-up task and notification/)
})

test("system validation rejects decorative or cross-tenant output", async () => {
  const validation = await read("lib/786-chat/validation.ts")

  assert.match(validation, /Missing required system file/)
  assert.match(validation, /Tenant-scoped schema is missing company_id/)
  assert.match(validation, /Server tenant guard does not enforce company ownership/)
  assert.match(validation, /Operational PostgreSQL schema or audit storage is incomplete/)
  assert.match(validation, /System CRUD API is not implemented/)
  assert.match(validation, /CREATE\\s\+\(\?:UNIQUE/)
  assert.match(validation, /TIMESTAMPTZ/)
})

test("manufacturing and pest control retain traceable domain architecture", async () => {
  const source = await read("lib/786-chat/system-blueprints.ts")

  for (const value of [
    "supplier-receipt-to-batch",
    "quality-release-or-hold",
    "temperature-hygiene-allergen-check",
    "downtime-maintenance-and-wastage",
    "recall-trace",
    "device-registration-and-qr-pairing",
    "mqtt-or-https-telemetry-to-alert",
    "technician-work-order-dispatch",
    "site-building-floor-room-location",
    "mqtt-adapter",
    "https-ingestion",
  ]) {
    assert.match(source, new RegExp(value))
  }
})

test("CRM blueprint includes the complete lead-to-conversion lifecycle", async () => {
  const source = await read("lib/786-chat/system-blueprints.ts")
  for (const value of [
    "lead-capture-to-customer",
    "sales-follow-up-notification",
    "booking-to-sale",
    "campaign-conversion-attribution",
  ]) {
    assert.match(source, new RegExp(value))
  }
})
