import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const source = fs.readFileSync('components/786-admin/admin-chat-url-header-controller.tsx', 'utf8')

test('active project is force-validated before trusting iframe route markers', () => {
  assert.match(source, /validatedProjectId/)
  assert.match(source, /forceValidation/)
  assert.match(source, /validatedProjectId !== projectId/)
})
