import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const capabilities = await readFile(new URL("../../lib/786-chat/backend-capabilities.ts", import.meta.url), "utf8")

test("auth generation uses exact schema table names in schema and migration", () => {
  for (const table of ["users", "sessions", "email_verification_tokens", "password_reset_tokens"]) {
    assert.match(capabilities, new RegExp(table))
  }
  assert.match(capabilities, /AUTHENTICATION SQL CONTRACT/)
  assert.match(capabilities, /BOTH sql\/schema\.sql and sql\/migrations\/001_initial\.sql/)
  assert.match(capabilities, /Authentication migration is missing/)
})

test("missing auth support tables are normalized before backend acceptance", () => {
  assert.match(capabilities, /normalizeGeneratedAuthenticationSchema/)
  assert.match(capabilities, /AUTH_SUPPORT_TABLE_NAMES/)
  assert.match(capabilities, /786\.Chat auth compatibility: exact required auth table names/)
  assert.match(capabilities, /normalizeGeneratedAuthenticationSchema\(specification, files\)/)
  assert.match(capabilities, /REFERENCES users\(id\) ON DELETE CASCADE/)
})
