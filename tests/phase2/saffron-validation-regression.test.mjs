import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const validation = fs.readFileSync('lib/786-chat/validation.ts', 'utf8')

test('responsive web output is not forced to include Expo mobile files from a stale mobile flag', () => {
  assert.match(validation, /requiresStandaloneMobileArtifacts/)
  assert.match(validation, /specification\.projectType === "mobile-application" \|\| hasAnyMobileArtifact/)
  assert.match(validation, /responsive web application with no standalone mobile artifact set/)
})

test('database validation repairs a missing or incompatible migration runner before backend acceptance', () => {
  assert.match(validation, /normalizeGeneratedMigrationRunner\(specification, files\)/)
  assert.match(validation, /@neondatabase\\\/serverless/)
  assert.match(validation, /DATABASE_URL is required to run migrations/)
  assert.match(validation, /001_initial\.sql/)
  assert.match(validation, /await sql\(migration, \[\]\)/)
})
