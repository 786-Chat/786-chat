import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const planner = await readFile(new URL("../../lib/786-chat/planner.ts", import.meta.url), "utf8")

test("auth and CRUD workflow plans explicitly require real forms", () => {
  assert.match(planner, /real HTML form/)
  assert.match(planner, /real HTML registration form/)
  assert.match(planner, /real <form> elements with submit handling/)
  assert.match(planner, /create workflow route with a real HTML form/)
  assert.match(planner, /detail and edit workflow route with a real edit form/)
})
