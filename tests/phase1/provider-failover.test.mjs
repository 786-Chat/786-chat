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

test("sequential provider attempts are bounded inside the Vercel window", () => {
  assert.match(providerController, /PRIMARY_ATTEMPT_TIMEOUT_MS = 105_000/)
  assert.match(providerController, /FALLBACK_ATTEMPT_TIMEOUT_MS = 65_000/)
  assert.match(providerController, /maxDuration = 180/)
  assert.match(providerController, /for \(const \[position, mode\] of configuredModes\.entries\(\)\)/)
  assert.match(providerController, /controller\.abort/)
})

test("fallback starts only after the primary provider fails", () => {
  assert.match(providerController, /The alternate provider starts only after a real primary/)
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

test("compact websites prefer DeepSeek Flash while complex apps keep normal selection", () => {
  assert.match(providerController, /requestedMode === "auto" && compactEligible/)
  assert.match(providerController, /\? "deepseek-flash"/)
  assert.match(providerController, /: resolvedPrimaryMode\(requestedMode, hasAttachments\)/)
})
