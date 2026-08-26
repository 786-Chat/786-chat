import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../../", import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), "utf8")
}

test("Neon compatibility normalizer handles getSql/getDb query methods", async () => {
  const code = await source("lib/786-chat/neon-compatibility.ts")
  assert.match(code, /get\(\?:Sql\|Db\)/)
  assert.match(code, /\.query/)
  assert.match(code, /neonVariables/)
  assert.match(code, /@neondatabase\\\/serverless/)
})

test("database-backed generated API routes are forced dynamic before isolated builds", async () => {
  const code = await source("lib/786-chat/neon-compatibility.ts")
  assert.match(code, /normalizeDatabaseApiRouteRuntime/)
  assert.match(code, /app\\\/api/)
  assert.match(code, /force-dynamic/)
  assert.match(code, /usesGeneratedDb/)
  assert.match(code, /get\(\?:Db\|Sql\)/)
})

test("build route normalizes generated Neon code before validation and dispatch", async () => {
  const code = await source("app/api/786-admin/projects/[id]/build/route.ts")
  const normalizeAt = code.indexOf("normalizeKnownGeneratedCompatibility")
  const validationAt = code.lastIndexOf("const validation = validateGeneratedProject")
  const dispatchAt = code.indexOf("dispatchGeneratedProjectBuild({")
  assert.ok(normalizeAt >= 0, "expected pre-build compatibility normalizer")
  assert.ok(validationAt > normalizeAt, "normalization must run before build validation")
  assert.ok(dispatchAt > validationAt, "normalization and validation must run before dispatch")
  assert.match(code, /Pre-build Neon compatibility normalization applied/)
})
