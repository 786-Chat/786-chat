import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const source = await readFile(new URL("../../lib/786-chat/provider-controller.ts", import.meta.url), "utf8")

test("provider failover checks direct keys and AI Gateway authentication", () => {
  assert.match(source, /DEEPSEEK_API_KEY/)
  assert.match(source, /GOOGLE_GENERATIVE_AI_API_KEY/)
  assert.match(source, /AI_GATEWAY_API_KEY/)
  assert.match(source, /VERCEL_OIDC_TOKEN/)
  assert.match(source, /process\.env\.VERCEL === "1"/)
  assert.match(source, /configuredModes/)
})

test("configured AI providers run sequentially within bounded limits", () => {
  assert.match(source, /FILE_LEVEL_GENERATION_DEADLINE_MS\s*=\s*170_000/)
  assert.match(source, /UNIT_DEEPSEEK_TIMEOUT_MS\s*=\s*75_000/)
  assert.match(source, /UNIT_GEMINI_TIMEOUT_MS\s*=\s*60_000/)
  assert.match(source, /for \(const \[position, mode\] of configuredModes\.entries\(\)\)/)
  assert.match(source, /result = await runAttempt/)
  assert.doesNotMatch(source, /attemptsByMode|Promise\.any/)
})

test("failed provider response includes a safe diagnostic", () => {
  assert.match(source, /compactFailure/)
  assert.match(source, /console\.error\(`\[786\.Chat provider failure\]/)
  assert.match(source, /safeReason/)
  assert.match(source, /providerStatus/)
})
