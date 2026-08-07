import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("backend API resources never invent a records route", async () => {
  const source = await read("lib/786-chat/backend-capabilities.ts")
  assert.doesNotMatch(source, /\? \["records"\]/)
  assert.doesNotMatch(source, /return resource \|\| "records"/)
})

test("explicit API routes can contribute concrete resources", async () => {
  const source = await read("lib/786-chat/specification.ts")
  assert.match(source, /requestedApiResources/)
  assert.match(source, /databaseTables: unique/)
})
