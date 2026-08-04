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

test("provider controller keeps text generation on direct DeepSeek", () => {
  assert.match(providerController, /candidateModes: CodegenMode\[\] = \[primaryMode\]/)
  assert.doesNotMatch(providerController, /alternateMode/)
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

test("direct provider attempt is bounded inside the Vercel window", () => {
  assert.match(providerController, /PRIMARY_ATTEMPT_TIMEOUT_MS = 170_000/)
  assert.match(providerController, /maxDuration = 180/)
  assert.match(providerController, /for \(const \[position, mode\] of configuredModes\.entries\(\)\)/)
  assert.match(providerController, /controller\.abort/)
})

test("the provider request records the single direct attempt", () => {
  assert.match(providerController, /fallback: position > 0/)
  assert.match(providerController, /continue/)
  assert.doesNotMatch(providerController, /rescueModes|abortFromCoordinator|coordinatorSignal/)
})

test("code generation uses gateway attribution and plan-specific budgets", () => {
  assert.match(codegen, /providerOptions/)
  assert.match(codegen, /gateway:\s*\{/)
  assert.match(codegen, /zeroDataRetention:\s*true/)
  assert.match(codegen, /maxOutputTokens:\s*input\.maxOutputTokens \?\? maxOutputTokensForPlan\(input\.userPlan\)/)
  assert.match(codegen, /maxRetries:\s*0/)
})

test("compact and complex requests both stay on DeepSeek", () => {
  assert.match(providerController, /requestedMode === "deepseek-pro" \? "deepseek-pro" : "deepseek-flash"/)
  assert.match(providerController, /const compact = compactEligible && providerForMode\(mode\) === "deepseek"/)
})
