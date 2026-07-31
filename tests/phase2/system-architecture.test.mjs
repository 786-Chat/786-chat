import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("active generation always receives application and multi-platform rules", async () => {
  const [route, optionalRules] = await Promise.all([
    read("app/api/786-chat/generate/route.ts"),
    read("lib/786-admin/optional-feature-rules.ts"),
  ])
  assert.match(route, /ACTIVE APPLICATION AND PLATFORM RULES/)
  assert.match(route, /systemArchitectureBrief\(specification\)/)
  assert.match(route, /OPTIONAL_PROJECT_FEATURE_RULES/)
  assert.match(optionalRules, /\$\{MULTI_PLATFORM_GENERATOR_RULES\}/)
  assert.ok(
    route.indexOf("OPTIONAL_PROJECT_FEATURE_RULES") <
      route.indexOf("specification.systemBlueprint"),
    "multi-platform rules must not depend on a system blueprint",
  )
})

test("specification detects platforms and architecture plans real contracts", async () => {
  const [specification, architecture, planner] = await Promise.all([
    read("lib/786-chat/specification.ts"),
    read("lib/786-chat/system-architecture.ts"),
    read("lib/786-chat/planner.ts"),
  ])
  for (const platform of ["web", "mobile", "backend", "database", "iot"]) {
    assert.match(specification, new RegExp(`"${platform}"`))
  }
  for (const contract of [
    "moduleGraph",
    "databaseTables",
    "apiContracts",
    "roles",
    "tenantIsolation",
    "migrationsRequired",
  ]) {
    assert.match(architecture, new RegExp(contract))
  }
  assert.match(planner, /mobile\/app\/index\.tsx/)
  assert.match(planner, /app\/api\/\$\{resource\}\/\[id\]\/route\.ts/)
})

test("system validation requires collection and item CRUD plus Neon migration integrity", async () => {
  const validation = await read("lib/786-chat/validation.ts")
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    assert.ok(validation.includes(String.raw`function\s+${method}`))
  }
  assert.match(validation, /REFERENCES/)
  assert.match(validation, /CREATE\\s\+\(\?:UNIQUE/)
  assert.match(validation, /TIMESTAMPTZ/)
  assert.match(validation, /Missing required mobile file/)
})
