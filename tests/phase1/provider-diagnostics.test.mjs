import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../lib/786-chat/provider-controller.ts', import.meta.url), 'utf8')

test('provider failover checks configured keys before attempting generation', () => {
  assert.match(source, /DEEPSEEK_API_KEY/)
  assert.match(source, /GOOGLE_GENERATIVE_AI_API_KEY/)
  assert.match(source, /GEMINI_API_KEY/)
  assert.match(source, /configuredModes/)
})

test('configured AI providers start concurrently with provider-specific limits', () => {
  assert.match(source, /Promise\.race/)
  assert.match(source, /attemptsByMode/)
  assert.match(source, /GEMINI_ATTEMPT_TIMEOUT_MS\s*=\s*25_000/)
  assert.match(source, /DEEPSEEK_ATTEMPT_TIMEOUT_MS\s*=\s*45_000/)
  assert.match(source, /attemptTimeout\(mode/)
  assert.doesNotMatch(source, /for\s*\([^)]*modesToRun[^)]*\)\s*\{\s*await runAttempt/)
})

test('failed provider response includes a safe diagnostic', () => {
  assert.match(source, /compactFailure/)
  assert.match(source, /console\.error\(`\[786\.Chat provider failure\]/)
  assert.match(source, /safeReason/)
})
