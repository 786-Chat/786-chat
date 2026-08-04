import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const source = fs.readFileSync('lib/786-chat/specification.ts', 'utf8')

test('negative backend requirements are removed before backend classification', () => {
  assert.match(source, /backendRequirements:\s*unique\(matches\(positivePrompt/)
})

test('an email input does not automatically request an email provider', () => {
  assert.doesNotMatch(source, /\[\/\\bemail\\b\/i,\s*"email"\]/)
  assert.match(source, /email service/)
})
