import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const canonicalRoute = await readFile("app/api/786-chat/generate/route.ts", "utf8")
const providerController = await readFile("lib/786-chat/provider-controller.ts", "utf8")
const codegen = await readFile("lib/786-admin/codegen.ts", "utf8")
const workspaceApi = await readFile("components/786-chat/api.ts", "utf8")

test("the workspace uses one canonical provider entry point", () => {
  assert.match(workspaceApi, /\/api\/786-chat\/generate/)
  assert.doesNotMatch(workspaceApi, /chat-resilient|chat-compact|\/api\/786-admin\/chat/)
})

test("provider controller attempts an alternate configured provider", () => {
  assert.match(providerController, /alternateMode/)
  assert.match(providerController, /gemini-pro/)
  assert.match(providerController, /deepseek-pro/)
  assert.match(providerController, /providerFailoverUsed/)
})

test("provider controller has no dependency on legacy generator routes", () => {
  assert.match(providerController, /generateProjectCode/)
  assert.doesNotMatch(providerController, /786-admin\/chat|chat-compact|premium-fallback/)
})

test("canonical generation rejects local fallback output", () => {
  assert.match(canonicalRoute, /fellBackToLocal === true/)
  assert.match(canonicalRoute, /No generic fallback project was accepted or saved/)
  assert.match(canonicalRoute, /status:\s*503/)
})

test("parallel provider attempts are bounded inside the Vercel window", () => {
  assert.match(providerController, /GEMINI_ATTEMPT_TIMEOUT_MS = 25_000/)
  assert.match(providerController, /DEEPSEEK_ATTEMPT_TIMEOUT_MS = 45_000/)
  assert.match(providerController, /maxDuration = 60/)
  assert.match(providerController, /Promise\.race/)
})

test("DeepSeek code generation disables slow thinking mode", () => {
  assert.match(codegen, /providerOptions/)
  assert.match(codegen, /deepseek:\s*\{\s*thinking:\s*\{\s*type:\s*"disabled"/)
})
