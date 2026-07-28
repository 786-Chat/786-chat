import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const resilientRoute = await readFile("app/api/786-admin/chat-resilient/route.ts", "utf8")
const proxy = await readFile("proxy.ts", "utf8")

test("chat generation is routed through the resilient provider wrapper", () => {
  assert.match(proxy, /chat-resilient/)
  assert.match(proxy, /x-786-resilient-attempt/)
})

test("resilient wrapper retries using an alternate provider mode", () => {
  assert.match(resilientRoute, /alternateMode/)
  assert.match(resilientRoute, /gemini-pro/)
  assert.match(resilientRoute, /deepseek-pro/)
  assert.match(resilientRoute, /providerFailoverUsed/)
})

test("local fallback is clearly disclosed instead of reported as AI success", () => {
  assert.match(resilientRoute, /AI FALLBACK USED/)
  assert.match(resilientRoute, /limited local fallback generator/)
  assert.match(resilientRoute, /AI_FALLBACK_USED/)
})

test("total provider attempts remain inside the Vercel function window", () => {
  assert.match(resilientRoute, /AI_ATTEMPT_TIMEOUT_MS = 25_000/)
  assert.match(resilientRoute, /maxDuration = 60/)
})
