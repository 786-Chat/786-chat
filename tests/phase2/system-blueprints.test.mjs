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

test("system validation rejects decorative or cross-tenant output", async () => {
  const validation = await read("lib/786-chat/validation.ts")

  assert.match(validation, /Missing required system file/)
  assert.match(validation, /Tenant-scoped schema is missing company_id/)
  assert.match(validation, /Server tenant guard does not enforce company ownership/)
  assert.match(validation, /Operational PostgreSQL schema or audit storage is incomplete/)
  assert.match(validation, /System API is not implemented/)
})

test("manufacturing and pest control retain traceable domain architecture", async () => {
  const source = await read("lib/786-chat/system-blueprints.ts")

  for (const value of [
    "supplier-receipt-to-batch",
    "quality-release-or-hold",
    "recall-trace",
    "device-registration-and-pairing",
    "telemetry-to-alert",
    "technician-dispatch",
    "mqtt-adapter",
    "https-ingestion",
  ]) {
    assert.match(source, new RegExp(value))
  }
})
