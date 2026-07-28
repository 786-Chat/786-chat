import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const optionalRules = await readFile("lib/786-admin/optional-feature-rules.ts", "utf8")
const platformRules = await readFile("lib/786-admin/multi-platform-generator-rules.ts", "utf8")

test("active generation rules include the multi-platform layer", () => {
  assert.match(optionalRules, /MULTI_PLATFORM_GENERATOR_RULES/)
  assert.match(optionalRules, /\$\{MULTI_PLATFORM_GENERATOR_RULES\}/)
})

test("multi-platform requests are not collapsed into landing pages", () => {
  assert.match(platformRules, /Do not collapse a multi-platform request into one Next\.js landing page/)
  assert.match(platformRules, /web, Android, iPhone\/iPad, backend, database, IoT\/device service/)
})

test("Expo Android and iOS output has a defined project structure", () => {
  assert.match(platformRules, /Expo \+ React Native/)
  assert.match(platformRules, /mobile\/app\/index\.tsx/)
  assert.match(platformRules, /login\.tsx, dashboard\.tsx, devices\.tsx, alerts\.tsx and settings\.tsx/)
  assert.match(platformRules, /mobile\/app\.json and mobile\/package\.json/)
})

test("shared backend and multi-company isolation are mandatory", () => {
  assert.match(platformRules, /shared schemas\/types/)
  assert.match(platformRules, /company_id/)
  assert.match(platformRules, /Prevent Company A from reading or writing Company B records/)
})

test("pest IoT generation covers onboarding telemetry and hardware boundaries", () => {
  assert.match(platformRules, /QR-code pairing/)
  assert.match(platformRules, /Wi-Fi setup, Bluetooth pairing/)
  assert.match(platformRules, /trap-open\/trap-closed state/)
  assert.match(platformRules, /MQTT\/HTTPS ingestion/)
  assert.match(platformRules, /generate a simulator and adapter interface/)
})

test("manufacturing and food production generation covers operational modules", () => {
  assert.match(platformRules, /purchase orders/)
  assert.match(platformRules, /recipes\/BOM/)
  assert.match(platformRules, /temperature records/)
  assert.match(platformRules, /allergens/)
  assert.match(platformRules, /barcode\/QR scanning/)
})

test("generation pipeline validates platforms and uses vertical slices", () => {
  assert.match(platformRules, /identify application type -> identify platforms/)
  assert.match(platformRules, /generate Expo app when requested/)
  assert.match(platformRules, /coherent end-to-end vertical slice/)
  assert.match(platformRules, /Never claim app-store publication/)
})
