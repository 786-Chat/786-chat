import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const specification = await readFile("lib/786-chat/specification.ts", "utf8")

test("a visual login page does not automatically require backend and database files", () => {
  assert.match(specification, /const functionalAuthRequested =/)
  assert.doesNotMatch(specification, /api\|backend\|server\|saas\|crm\|erp\|auth\|log\[ -\]\?in\|register/)
  assert.doesNotMatch(specification, /database\|postgres\|neon\|relational\|auth\|log\[ -\]\?in\|register/)
  assert.match(specification, /functionalAuthRequested \|\| systemBlueprint \? \["backend"\]/)
  assert.match(specification, /functionalAuthRequested \|\| systemBlueprint \? \["database"\]/)
})

test("explicit functional authentication still requires the full backend", () => {
  assert.match(specification, /working\|functional\|secure\|real\|database\[- \]backed/)
  assert.match(specification, /user accounts\?/) 
  assert.match(specification, /account system/)
  assert.match(specification, /sessions\?/)
})
