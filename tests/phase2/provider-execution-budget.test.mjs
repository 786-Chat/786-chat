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

test("full-stack file generation returns before the Vercel hard timeout", () => {
  assert.match(route, /maxDuration = 300/)
  assert.match(controller, /FILE_LEVEL_GENERATION_DEADLINE_MS = 170_000/)
  assert.match(controller, /MAX_FILE_UNITS_PER_REQUEST = 2/)
  assert.match(controller, /const deadlineAt = Date\.now\(\) \+ FILE_LEVEL_GENERATION_DEADLINE_MS/)
  assert.match(controller, /remainingMs = deadlineAt - startedAt/)
  assert.match(controller, /Math\.min\(providerTimeoutMs, remainingMs\)/)
})

test("timed-out provider work is aborted instead of running in the background", () => {
  assert.match(controller, /new AbortController\(\)/)
  assert.match(controller, /abortSignal: controller\.signal/)
  assert.match(controller, /controller\.abort/)
})

test("provider fallback is sequential and never races providers", () => {
  assert.match(controller, /for \(const \[position, mode\] of configuredModes\.entries\(\)\)/)
  assert.match(controller, /result = await runAttempt/)
  assert.doesNotMatch(controller, /coordinatorSignal|attemptsByMode/)
})

test("automatic full-stack generation prefers DeepSeek then Gemini fallback", () => {
  assert.match(controller, /isComplex \? \["deepseek-flash","gemini-flash"\]/)
  assert.match(controller, /candidateModes\.filter\(modeConfigured\)/)
  assert.match(controller, /providers: configuredProviders/)
})

test("large full-stack plans use resumable single-file units", () => {
  assert.match(controller, /FILE-LEVEL FULL-STACK GENERATION/)
  assert.match(controller, /Generate ONLY the single target file/)
  assert.match(controller, /units\.slice\(startIndex, startIndex \+ unitLimit\)/)
  assert.match(controller, /initialFiles: supplied\?\.completedFiles/)
  assert.match(controller, /continuationRequired: true/)
  assert.match(route, /signGenerationContinuation/)
  assert.match(route, /recordBuilderGenerationProgress/)
})

test("provider output and retries are explicitly bounded", () => {
  assert.match(controller, /const maxOutputTokens = isFileUnit \? 8_000/)
  assert.match(codegen, /maxOutputTokens:\s*input\.maxOutputTokens \?\? maxOutputTokensForPlan\(input\.userPlan\)/)
  assert.match(codegen, /maxRetries:\s*0/)
  assert.match(codegen, /abortSignal: input\.abortSignal/)
})
