import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const planner = fs.readFileSync('lib/786-chat/planner.ts', 'utf8')
const provider = fs.readFileSync('lib/786-chat/provider-controller.ts', 'utf8')
const integrity = fs.readFileSync('lib/786-chat/project-output-integrity.ts', 'utf8')

test('auth support routes are never expanded as CRUD resources', () => {
  assert.match(planner, /"forgot-password"/)
  assert.match(planner, /"reset-password"/)
  assert.match(planner, /"verify-email"/)
  assert.match(planner, /NON_CRUD_APPLICATION_ROUTES/)
})

test('responsive web applications do not plan a standalone Expo client', () => {
  assert.match(planner, /standaloneMobile = specification\.platforms\.includes\("mobile"\) && specification\.projectType === "mobile-application"/)
  assert.match(planner, /const mobileFiles = standaloneMobile \?/)
  assert.match(planner, /\.\.\.\(standaloneMobile \? \["Generate the Expo mobile client/)
})

test('foundation generation orders auth and email contracts before auth routes', () => {
  assert.match(provider, /"lib\/server\/auth\.ts","lib\/server\/email\.ts"/)
  assert.match(provider, /app\\\/api\\\/auth/)
  assert.match(provider, /foundationOrder/)
  assert.match(provider, /lib\\\/server\\\/\(env\|db\|auth\|email/)
})

test('forgot-password generation uses the real email contract', () => {
  assert.match(planner, /sendPasswordResetEmail\(email, token\)/)
  assert.match(provider, /sendPasswordResetEmail from the supplied email module/)
  assert.match(provider, /lib\/server\/email\.ts/)
})

test('file-level output rejects unplanned local imports', () => {
  assert.match(integrity, /INVALID_PROJECT_IMPORT/)
  assert.match(integrity, /Complete planned file allowlist/)
  assert.match(integrity, /localImportBase/)
  assert.match(provider, /Never import an npm package that is absent from the supplied package\.json/)
  assert.match(provider, /Never invent @\/lib\/auth, @\/lib\/data, next-auth/)
})

test('canonical auth contract prevents createSession and cookie-shape drift', () => {
  assert.match(planner, /signSession\(payload\): Promise<string>/)
  assert.match(provider, /Do NOT create a competing createSession API/)
  assert.match(provider, /Never use createSession or session\.cookie/)
})
