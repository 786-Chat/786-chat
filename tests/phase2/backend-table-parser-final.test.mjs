import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("database parser reserves SQL prose words and does not treat them as tables", async () => {
  const specification = await read("lib/786-chat/specification.ts")
  assert.match(specification, /"statement"/)
  assert.match(specification, /"syntax"/)
  assert.match(specification, /"column"/)
  assert.match(specification, /Plural table lists may use plain resource headings followed by field bullets/)
})

test("database edit intent ignores CREATE TABLE syntax prose", async () => {
  const editIntent = await read("lib/786-chat/edit-intent.ts")
  assert.match(editIntent, /RESERVED_DATABASE_WORDS/)
  assert.match(editIntent, /hasExplicitDatabaseTableCreation/)
  assert.match(editIntent, /"syntax"/)
  assert.match(editIntent, /"statement"/)
})
