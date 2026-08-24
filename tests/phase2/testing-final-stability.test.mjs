import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("generated builds normalize TypeScript target and iteration support", async () => {
  const compatibility = await read("lib/786-chat/project-compatibility.ts")
  assert.match(compatibility, /normalizePortableTypeScriptConfig/)
  assert.match(compatibility, /compilerOptions\.target = "ES2017"/)
  assert.match(compatibility, /compilerOptions\.downlevelIteration = true/)
  assert.match(compatibility, /typescript-es2017-iteration/)
})

test("repaired builds finish with a terminal repaired or exhausted state", async () => {
  const runnerStore = await read("lib/786-admin/build-runner-store.ts")
  assert.match(runnerStore, /repair_attempt > 0 AND repair_status = 'pending'/)
  assert.match(runnerStore, /THEN 'running'/)
  assert.match(runnerStore, /repair_attempt > 0 THEN 'repaired'/)
  assert.match(runnerStore, /THEN 'exhausted'/)
})

test("synthetic customer journey uses public production and exercises owner approval", async () => {
  const journey = await read("app/api/cron/customer-journey/route.ts")
  assert.match(journey, /SYNTHETIC_MONITOR_ORIGIN/)
  assert.match(journey, /https:\/\/786\.chat/)
  assert.match(journey, /approvalRequired/)
  assert.match(journey, /account_status !== "pending"/)
  assert.match(journey, /"admin-approval"/)
  assert.match(journey, /account_status = 'active'/)
})

test("admin usage no longer queries or writes the absent usage_logs metadata column", async () => {
  const usage = await read("app/api/admin/usage/route.ts")
  assert.doesNotMatch(usage, /metadata->>/)
  assert.doesNotMatch(usage, /usage_logs \(user_id, action, metadata\)/)
  assert.match(usage, /admin_\$\{actionType\}/)
})
