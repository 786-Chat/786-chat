import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const createRoute = await readFile(
  new URL("../../app/api/786-chat/projects/route.ts", import.meta.url),
  "utf8",
)
const updateRoute = await readFile(
  new URL("../../app/api/786-chat/projects/[id]/route.ts", import.meta.url),
  "utf8",
)
const persistenceValidation = await readFile(
  new URL("../../lib/786-chat/persistence-validation.ts", import.meta.url),
  "utf8",
)

test("project create revalidates generated files against their specification", () => {
  assert.match(createRoute, /validatePersistedGeneration/)
  assert.match(createRoute, /status: 422/)
})

test("project update revalidates the complete replacement file set", () => {
  assert.match(updateRoute, /validatePersistedGeneration/)
  assert.match(updateRoute, /status: 422/)
})

test("persistence validation rejects malformed specifications", () => {
  assert.match(persistenceValidation, /Stored project specification is invalid/)
  assert.match(persistenceValidation, /validateGeneratedProject/)
})
