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

test("imported Express runtime exposes a Vercel-recognized root entrypoint without rewriting saved source", () => {
  const helper = readFileSync("lib/786-admin/runtime-deployment-files.ts", "utf8")

  assert.match(helper, /prepareImportedExpressRuntime/)
  assert.match(helper, /server\/index\.ts/)
  assert.match(helper, /runtimeFiles\["index\.ts"\]/)
  assert.match(helper, /import express from \\"express\\"/)
  assert.match(helper, /import \{ app \} from \\"\.\/server\/index\\"/)
  assert.match(helper, /export default app/)
  assert.match(helper, /export \$1 app = express\(\);/)
})
