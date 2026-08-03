import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../lib/786-chat/provider-controller.ts', import.meta.url), 'utf8')

test('provider failover checks AI Gateway authentication before generation', () => {
  assert.match(source, /AI_GATEWAY_API_KEY/)
  assert.match(source, /VERCEL_OIDC_TOKEN/)
  assert.match(source, /process\.env\.VERCEL === "1"/)
  assert.match(source, /configuredModes/)
})

test('configured AI providers run sequentially within bounded limits', () => {
  assert.match(source, /PRIMARY_ATTEMPT_TIMEOUT_MS\s*=\s*105_000/)
  assert.match(source, /FALLBACK_ATTEMPT_TIMEOUT_MS\s*=\s*65_000/)
  assert.match(source, /attemptTimeout\(position/)
  assert.match(source, /for \(const \[position, mode\] of configuredModes\.entries\(\)\)/)
  assert.match(source, /result = await runAttempt/)
  assert.doesNotMatch(source, /attemptsByMode/)
})

test('failed provider response includes a safe diagnostic', () => {
  assert.match(source, /compactFailure/)
  assert.match(source, /console\.error\(`\[786\.Chat provider failure\]/)
  assert.match(source, /safeReason/)
})
