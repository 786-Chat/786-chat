import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("database table parser does not treat validation words or field headings as table names", async () => {
  const specification = await read("lib/786-chat/specification.ts")
  assert.match(specification, /const RESERVED_TABLE_WORDS/)
  assert.match(specification, /table\s*:\s*\(\[a-z\]\[a-z0-9_\]\*\)/)
  assert.doesNotMatch(specification, /\(\?:create\\s\+\)\?table\\s\*:\?\\s\*/)
  assert.match(specification, /database\s+table|data\s+table|admin\s+table|responsive\s+table/i)
})

test("database edit intent accepts colon syntax without falling back to records", async () => {
  const editIntent = await read("lib/786-chat/edit-intent.ts")
  assert.match(editIntent, /table\s*:\?\s*\(\?:called\|named\)\?\s*/)
  assert.doesNotMatch(editIntent, /requestedTable:\s*databaseTableName\(prompt\)\s*\|\|\s*"records"/)
})
