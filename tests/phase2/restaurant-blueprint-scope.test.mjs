import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const source = await readFile(new URL("../../lib/786-chat/system-blueprints.ts", import.meta.url), "utf8")

test("generic restaurant management does not force the Restaurant POS blueprint", () => {
  assert.doesNotMatch(
    source,
    /aliases:\s*\["restaurant pos",\s*"pos system",\s*"point of sale",\s*"restaurant management"\]/,
  )
  assert.match(
    source,
    /aliases:\s*\["restaurant pos",\s*"pos system",\s*"point of sale",\s*"restaurant point of sale"\]/,
  )
})

test("real POS blueprints state the complete SQL and tenant schema contract", () => {
  assert.match(source, /SQL schema rule: sql\/schema\.sql must CREATE TABLE for every relational entity listed above/)
  assert.match(source, /company_id REFERENCES companies\(id\)/)
  assert.match(source, /CREATE INDEX statements must include company_id/)
})
