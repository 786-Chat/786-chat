import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const planner = await readFile(new URL("../../lib/786-chat/planner.ts", import.meta.url), "utf8")

test("backend application collection routes become CRUD workflow pages", () => {
  assert.match(planner, /capabilities\.includes\("api"\)/)
  assert.match(planner, /NON_CRUD_APPLICATION_ROUTES/)
  assert.match(planner, /resources\.add\(resource\)/)
  assert.match(planner, /app\/\$\{resource\}\/new\/page\.tsx/)
  assert.match(planner, /app\/\$\{resource\}\/\[id\]\/page\.tsx/)
})

test("non-CRUD utility pages are excluded from inferred detail routes", () => {
  for (const route of ["dashboard", "login", "contact", "settings", "reports"]) {
    assert.match(planner, new RegExp(`\\"${route}\\"`))
  }
})
