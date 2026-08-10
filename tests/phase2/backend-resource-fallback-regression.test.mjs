import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("explicit API file paths produce concrete database resources", async () => {
  const source = await read("lib/786-chat/specification.ts")
  assert.match(source, /function explicitApiResources/)
  assert.match(source, /app\\\/api\\\//)
  assert.match(source, /requestedApiResources/)
  assert.match(source, /databaseRequested \? requestedApiResources/)
})

test("singular create table syntax accepts a trailing colon", async () => {
  const source = await read("lib/786-chat/specification.ts")
  assert.match(source, /\?=\\s\*:/)
})

test("backend API validation never invents a records resource", async () => {
  const source = await read("lib/786-chat/backend-capabilities.ts")
  assert.doesNotMatch(source, /\? \["records"\]/)
  assert.doesNotMatch(source, /return resource \|\| "records"/)
  assert.match(source, /\.filter\(Boolean\)/)
})
