import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const source = await readFile(new URL("../../lib/786-admin/vercel-project-deployer.ts", import.meta.url), "utf8")

test("generated runtime recovery is limited to never-deployed project namespaces", () => {
  assert.match(source, /function isExactGeneratedSchema/)
  assert.match(source, /schema === safeSchemaName\(projectId\)/)
  assert.match(source, /FROM admin_project_builds/)
  assert.match(source, /status = 'passed'/)
  assert.match(source, /deployment_url IS NOT NULL/)
  assert.match(source, /!deployed/)
})

test("partial generated schema recovery drops only the exact namespace and retries once", () => {
  assert.match(source, /isRecoverablePartialSchemaError\(error\)/)
  assert.match(source, /DROP SCHEMA \"\$\{schema\}\" CASCADE/)
  assert.match(source, /CREATE SCHEMA \"\$\{schema\}\"/)
  const calls = source.match(/await applyMigrations\(\)/g) || []
  assert.equal(calls.length, 2)
})

test("deployed projects fail closed instead of resetting data", () => {
  assert.match(source, /if \(!mayRecover\) throw error/)
  assert.doesNotMatch(source, /DROP SCHEMA public/i)
  assert.doesNotMatch(source, /DROP DATABASE/i)
})
