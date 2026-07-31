import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const route = await readFile(
  new URL("../../app/api/786-chat/generate/route.ts", import.meta.url),
  "utf8",
)
const controller = await readFile(
  new URL("../../lib/786-chat/provider-controller.ts", import.meta.url),
  "utf8",
)
const codegen = await readFile(
  new URL("../../lib/786-admin/codegen.ts", import.meta.url),
  "utf8",
)
const canonicalGenerator = await readFile(
  new URL("../../app/api/786-chat/generate/route.ts", import.meta.url),
  "utf8",
)

test("canonical generation route leaves cleanup time after the DeepSeek budget", () => {
  assert.match(route, /maxDuration = 180/)
  assert.match(controller, /DEEPSEEK_ATTEMPT_TIMEOUT_MS = 150_000/)
})

test("timed-out provider work is aborted instead of running in the background", () => {
  assert.match(controller, /new AbortController\(\)/)
  assert.match(controller, /abortSignal: controller\.signal/)
  assert.match(controller, /controller\.abort/)
})

test("the first successful provider cancels other in-flight attempts", () => {
  assert.match(controller, /const coordinator = new AbortController\(\)/)
  assert.match(controller, /coordinatorSignal/)
  assert.match(controller, /Provider winner selected/)
})

test("invalid full systems receive one strict validation-guided repair pass", () => {
  assert.match(canonicalGenerator, /VALIDATION-GUIDED REPAIR — RETURN COMPLETE CONTENT FOR EVERY MODIFIED FILE/)
  assert.match(canonicalGenerator, /validation\.errors\.map/)
  assert.match(canonicalGenerator, /focusedSystemRepair/)
  assert.match(canonicalGenerator, /keyFiles: repairKeyFiles/)
  assert.match(canonicalGenerator, /persist an audit_logs event/)
  assert.match(canonicalGenerator, /operational page must contain a real form/)
  assert.match(canonicalGenerator, /sales follow-up task and notification/)
  assert.match(canonicalGenerator, /repairAttempted/)
  assert.match(canonicalGenerator, /validation\.valid && repairedProject/)
})

test("the active code generator requires tenant ownership rejection and real audit writes", () => {
  assert.match(codegen, /explicitly reject missing or mismatched company ownership/)
  assert.match(codegen, /persist a tenant-scoped audit_logs event/)
  assert.match(codegen, /comments do not count/)
  assert.match(codegen, /collection and item API route must reference companyId/)
  assert.match(codegen, /Static marketing cards do not count/)
  assert.match(codegen, /CRM must include a sales follow-up task and notification/)
})

test("large file generation has an explicit output and retry budget", () => {
  assert.match(codegen, /maxOutputTokens:\s*24_000/)
  assert.match(codegen, /maxRetries:\s*0/)
  assert.match(codegen, /abortSignal: input\.abortSignal/)
})
