import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("generated runtime provisioning prefers 001_initial over a partial schema snapshot", () => {
  const helper = readFileSync("lib/786-admin/runtime-deployment-files.ts", "utf8")
  const callback = readFileSync("app/api/786-admin/build-runner/callback/route.ts", "utf8")

  assert.match(helper, /sql\/migrations\/001_initial\.sql/)
  assert.match(helper, /delete runtimeFiles\["sql\/schema\.sql"\]/)
  assert.match(callback, /files: runtimeDeploymentFiles\(bundle\.files\)/)
})

test("generated runtime normalizes Drizzle statement breakpoints before Neon migrations", () => {
  const helper = readFileSync("lib/786-admin/runtime-deployment-files.ts", "utf8")

  assert.match(helper, /statement-breakpoint/)
  assert.match(helper, /source\.replace\(/)
})
