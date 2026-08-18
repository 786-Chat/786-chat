import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const controller = await readFile(new URL("../../lib/786-chat/provider-controller.ts", import.meta.url), "utf8")

test("validation repair is allowed through file-level generation even for an existing project", () => {
  assert.match(controller, /const isValidationRepair = \/\\bVALIDATION-GUIDED REPAIR\\b\/i/)
  assert.match(controller, /\(!isExistingEdit \|\| isValidationRepair\)/)
})

test("route validation repair focuses on every missing route before unrelated files", () => {
  assert.match(controller, /function validationRouteFilesFromPrompt/)
  assert.match(controller, /prompt\.matchAll\(matcher\)/)
  assert.match(controller, /return routeFiles\.length \? routeFiles : plannedFiles/)
  for (const path of ["app/customers/page.tsx", "app/reservations/page.tsx", "app/orders/page.tsx", "app/customers/new/page.tsx"]) {
    const route = path.replace(/^app\//, "/").replace(/\/page\.tsx$/, "")
    const sample = `Internal navigation points to missing route: ${route}`
    assert.match(sample, /missing route:/i)
  }
})
