import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const [planner, route] = await Promise.all([
  read("lib/786-chat/planner.ts"),
  read("app/api/786-chat/generate/route.ts"),
])

test("secure auth planning creates support pages before login links to them", () => {
  assert.match(planner, /app\/forgot-password\/page\.tsx/)
  assert.match(planner, /app\/reset-password\/page\.tsx/)
  assert.match(planner, /app\/verify-email\/page\.tsx/)
  assert.match(planner, /capabilities\.includes\("authentication"\)/)
})

test("validation repair is bounded to two passes instead of stopping after the first fix", () => {
  assert.match(route, /MAX_VALIDATION_REPAIR_PASSES\s*=\s*2/)
  assert.match(route, /repairPass\s*<\s*MAX_VALIDATION_REPAIR_PASSES/)
  assert.match(route, /repairPass:\s*repairPass\s*\+\s*1/g)
})

test("missing dynamic application routes are valid focused repair targets", () => {
  assert.match(route, /\\\[[a-z0-9_-]+\\\]/i)
  assert.match(route, /app\/\$\{route\.slice\(1\)\}\/page\.tsx/)
})
