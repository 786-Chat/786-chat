import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const planner = await readFile(
  new URL("../../lib/786-chat/planner.ts", import.meta.url),
  "utf8",
)

test("full-stack plans prioritize mandatory backend artifacts before frontend routes", () => {
  const backendIndex = planner.indexOf("...backendFiles")
  const layoutIndex = planner.indexOf('{ path: "app/layout.tsx"')
  const routeIndex = planner.indexOf("...specification.routes.map")

  assert.ok(backendIndex >= 0, "backend files must be present in the plan")
  assert.ok(layoutIndex > backendIndex, "backend files must precede layout generation")
  assert.ok(routeIndex > backendIndex, "backend files must precede frontend route generation")
  assert.match(planner, /Generate every mandatory backend file before any cosmetic or frontend rewrite/)
})

test("public database APIs do not require authentication acceptance", () => {
  assert.match(planner, /const requiresAuthentication = capabilities\.includes\("authentication"\)/)
  assert.match(planner, /Public data APIs remain functional without inventing authentication dependencies/)
})
