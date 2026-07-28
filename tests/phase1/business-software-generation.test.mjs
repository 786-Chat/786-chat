import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const rules = await readFile("lib/786-admin/optional-feature-rules.ts", "utf8")

test("operational systems are not reduced to landing pages", () => {
  assert.match(rules, /Never reduce ERP, CRM, manufacturing/)
  assert.match(rules, /generate real application architecture/)
  assert.match(rules, /Create app\/api\/\*\* route handlers/)
})

test("manufacturing, school and pest-control domains are covered", () => {
  assert.match(rules, /MANUFACTURING AND FOOD PRODUCTION/)
  assert.match(rules, /SCHOOL MANAGEMENT/)
  assert.match(rules, /PEST CONTROL AND FIELD SERVICE/)
  assert.match(rules, /batch\/lot traceability/)
})

test("IoT generation includes telemetry and safe hardware boundaries", () => {
  assert.match(rules, /IOT AND DEVICE MANAGEMENT/)
  assert.match(rules, /battery, signal strength, location, telemetry and event history/)
  assert.match(rules, /Wi-Fi, Bluetooth gateway, MQTT and HTTPS/)
  assert.match(rules, /create typed adapters and a simulator/)
  assert.match(rules, /Never pretend arbitrary hardware can be controlled/)
})

test("analytics and integrations are permitted when project-specific", () => {
  assert.match(rules, /Analytics, Automation, Integrations and device dashboards are valid modules/)
  assert.match(rules, /Never reject these modules merely because they were inappropriate in a previous unrelated project/)
})

test("multi-company SaaS enforces tenant boundaries", () => {
  assert.match(rules, /MULTI-COMPANY SAAS/)
  assert.match(rules, /tenant ownership keys/)
  assert.match(rules, /prevent cross-tenant access/)
})
