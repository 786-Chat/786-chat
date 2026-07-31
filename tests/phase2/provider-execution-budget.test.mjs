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

test("large file generation has an explicit output and retry budget", () => {
  assert.match(codegen, /maxOutputTokens:\s*24_000/)
  assert.match(codegen, /maxRetries:\s*0/)
  assert.match(codegen, /abortSignal: input\.abortSignal/)
})
