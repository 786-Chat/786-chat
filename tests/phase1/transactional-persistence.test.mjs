import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("generated project persistence uses one transaction for all records", async () => {
  const source = await read("lib/786-chat/persistence.ts")

  assert.match(source, /admin_projects/)
  assert.match(source, /admin_project_files/)
  assert.match(source, /admin_project_messages/)
  assert.match(source, /admin_project_revisions/)
  assert.match(source, /builder_generation_jobs/)
  assert.match(source, /await transaction\(queries\)/)
})

test("project edits replace the complete generated file set", async () => {
  const source = await read("lib/786-chat/persistence.ts")

  assert.match(source, /DELETE FROM admin_project_files/)
  assert.match(source, /Before AI generation/)
})

test("workspace uses only canonical project persistence routes", async () => {
  const source = await read("components/786-chat/api.ts")

  assert.match(source, /\/api\/786-chat\/projects/)
  assert.doesNotMatch(source, /\/api\/786-admin\/projects/)
})
