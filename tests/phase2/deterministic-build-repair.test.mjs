import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../lib/786-chat/deterministic-build-repair.ts', import.meta.url), 'utf8')
const pipeline = await readFile(new URL('../../lib/786-chat/build-repair.ts', import.meta.url), 'utf8')

test('repairs semantic Tailwind theme tokens reported by isolated builds', () => {
  assert.match(source, /border: 'var\(--border\)'/)
  assert.match(source, /input: 'var\(--input\)'/)
  assert.match(source, /ring: 'var\(--ring\)'/)
  assert.match(source, /background: 'var\(--background\)'/)
  assert.match(source, /class does not exist/i)
})

test('repairs zero-argument getDb factory mismatches', () => {
  assert.match(source, /Expected 0 arguments, but got 1/i)
  assert.match(source, /getDb\\s\*\\\(/)
  assert.match(source, /"getDb\(\)"/)
})

test('multi-error deterministic repair runs before single-category and AI repair', () => {
  assert.match(pipeline, /deterministicGeneratedBuildRepair\(context\.files, input\.logs\)[\s\S]*deterministicCompatibilityRepair/)
})
