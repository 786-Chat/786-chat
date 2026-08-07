import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("database table parser rejects validation words and field headings", async () => {
  const specification = await read("lib/786-chat/specification.ts")
  assert.match(specification, /const RESERVED_TABLE_WORDS/)
  assert.match(specification, /confirm customers table exists/i)
  assert.match(specification, /headings such as \"Fields:\"/)
  assert.match(specification, /responsive\\s\+table/)
})

test("database edit intent accepts colon syntax without a records fallback", async () => {
  const editIntent = await read("lib/786-chat/edit-intent.ts")
  assert.match(editIntent, /table\\s\*:\?\\s\*/)
  assert.doesNotMatch(editIntent, /databaseTableName\(prompt\) \|\| \"records\"/)
  assert.match(editIntent, /Do not invent a fallback table name/)
})
