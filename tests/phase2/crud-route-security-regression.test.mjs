import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const [planner, security] = await Promise.all([
  read("lib/786-chat/planner.ts"),
  read("lib/786-chat/generated-security.ts"),
])

test("CRUD application resources plan create and dynamic detail pages", () => {
  assert.match(planner, /backendApiResources/)
  assert.match(planner, /crudApplicationFiles/)
  assert.match(planner, /app\/\$\{resource\}\/new\/page\.tsx/)
  assert.match(planner, /app\/\$\{resource\}\/\[id\]\/page\.tsx/)
  assert.match(planner, /routeSet\.has\(route\)/)
})

test("logout may clean up its server session without a pre-existing auth guard", () => {
  assert.match(security, /PUBLIC_AUTH_BOOTSTRAP_ROUTE/)
  assert.match(security, /register\|login\|logout\|forgot-password\|reset-password\|verify-email/)
  assert.match(security, /!PUBLIC_AUTH_BOOTSTRAP_ROUTE\.test\(normalizedPath\)/)
})
