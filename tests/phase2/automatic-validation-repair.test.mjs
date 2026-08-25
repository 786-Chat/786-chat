import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("validation repair gets multiple automatic passes and extracts rejected file paths", async () => {
  const route = await read("app/api/786-chat/generate/route.ts")
  assert.match(route, /MAX_VALIDATION_REPAIR_PASSES = 5/)
  assert.match(route, /validationRepairFilesFromErrors/)
  assert.match(route, /VALIDATION-GUIDED AUTO REPAIR PASS/)
  assert.match(route, /without asking the user to send a repair prompt/)
})

test("backend dependencies are deterministically restored before AI repair", async () => {
  const backend = await read("lib/786-chat/backend-capabilities.ts")
  assert.match(backend, /normalizeGeneratedBackendDependencies/)
  assert.match(backend, /"server-only": "\^0\.0\.1"/)
  assert.match(backend, /"@neondatabase\/serverless": "\^1\.1\.0"/)
  assert.match(backend, /bcryptjs: "\^3\.0\.3"/)
  assert.match(backend, /jose: "\^6\.2\.3"/)
})

test("API route slugs are normalized to safe SQL table identifiers", async () => {
  const validation = await read("lib/786-chat/validation.ts")
  assert.match(validation, /function sqlIdentifier/)
  assert.match(validation, /replace\(\/\[\^a-z0-9_\]\+\/g, "_"\)/)
  assert.match(validation, /const normalizedTable = sqlIdentifier\(table\)/)
})

test("public scan database routes may be read-only but never mutate", async () => {
  const security = await read("lib/786-chat/generated-security.ts")
  assert.match(security, /PUBLIC_READ_ONLY_ROUTE/)
  assert.match(security, /isSafePublicReadOnlyDatabaseRoute/)
  assert.match(security, /PUBLIC_DATABASE_MUTATION/)
  assert.match(security, /Explicit public scan routes may be GET-only and token-scoped/)
})
