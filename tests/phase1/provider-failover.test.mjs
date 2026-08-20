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

test("provider controller prefers DeepSeek and retains Gemini fallback", () => {
  assert.match(providerController, /isComplex \? \["deepseek-flash","gemini-flash"\]/)
  assert.match(providerController, /largeFrontendEdit \? \["gemini-flash","deepseek-flash"\]/)
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

test("full-stack provider work is bounded below the route execution window", () => {
  assert.match(providerController, /maxDuration = 300/)
  assert.match(providerController, /FILE_LEVEL_GENERATION_DEADLINE_MS = 170_000/)
  assert.match(providerController, /MAX_FILE_UNITS_PER_REQUEST = 2/)
  assert.match(providerController, /Math\.min\(providerTimeoutMs, remainingMs\)/)
  assert.match(providerController, /controller\.abort/)
})

test("provider attempts are sequential rather than raced", () => {
  assert.match(providerController, /for \(const \[position, mode\] of configuredModes\.entries\(\)\)/)
  assert.match(providerController, /fallback: position > 0/)
  assert.doesNotMatch(providerController, /rescueModes|abortFromCoordinator|coordinatorSignal|Promise\.any/)
})

test("code generation uses gateway attribution and plan-specific budgets", () => {
  assert.match(codegen, /providerOptions/)
  assert.match(codegen, /gateway:\s*\{/)
  assert.match(codegen, /zeroDataRetention:\s*true/)
  assert.match(codegen, /maxOutputTokens:\s*input\.maxOutputTokens \?\? maxOutputTokensForPlan\(input\.userPlan\)/)
  assert.match(codegen, /maxRetries:\s*0/)
})

test("large full-stack generation can resume without starting over", () => {
  assert.match(providerController, /initialFiles: supplied\?\.completedFiles/)
  assert.match(providerController, /continuationRequired: true/)
  assert.match(canonicalRoute, /signGenerationContinuation/)
  assert.match(canonicalRoute, /recordBuilderGenerationProgress/)
})
