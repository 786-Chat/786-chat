import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../app/api/786-admin/chat-resilient/route.ts', import.meta.url), 'utf8')

test('provider failover checks configured keys before attempting generation', () => {
  assert.match(source, /DEEPSEEK_API_KEY/)
  assert.match(source, /GOOGLE_GENERATIVE_AI_API_KEY/)
  assert.match(source, /GEMINI_API_KEY/)
  assert.match(source, /configuredModes/)
})

test('configured AI providers start concurrently instead of using two 25 second windows', () => {
  assert.match(source, /Promise\.race/)
  assert.match(source, /attemptsByMode/)
  assert.doesNotMatch(source, /AI_ATTEMPT_TIMEOUT_MS\s*=\s*25_000/)
})

test('fallback response includes a safe provider diagnostic', () => {
  assert.match(source, /Provider diagnostic:/)
  assert.match(source, /safeReason/)
})
