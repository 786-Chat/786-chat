import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const blueprints = await readFile(
  new URL("../../lib/786-chat/system-blueprints.ts", import.meta.url),
  "utf8",
)

test("CRM blueprint requires explicit sales workflow intent", () => {
  assert.match(blueprints, /function hasCrmSalesIntent\(prompt: string\)/)
  assert.match(blueprints, /candidate\.id !== "crm" \|\| hasCrmSalesIntent\(prompt\)/)
  assert.match(blueprints, /sales\\s\+pipeline/)
  assert.match(blueprints, /opportunit/)
  assert.match(blueprints, /follow\[-\\s\]\?up/)
})

test("generic CRM wording is not enough to force lead-to-conversion blueprint", () => {
  assert.doesNotMatch(
    blueprints,
    /request\.includes\(alias\)\)\s*\.sort/,
    "blueprint selection must keep the CRM sales-intent gate",
  )
})
