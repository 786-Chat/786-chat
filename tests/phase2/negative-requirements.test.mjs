import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = await readFile(
  new URL("../../lib/786-chat/specification.ts", import.meta.url),
  "utf8",
)

test("negative bullet blocks are removed before route and backend analysis", () => {
  assert.match(source, /startsNegativeList/)
  assert.match(source, /skippingNegativeList/)
  assert.match(source, /requestedRoutes = explicitRoutes\(positivePrompt\)/)
  assert.match(source, /requestedApiResources = explicitApiResources\(positivePrompt\)/)
  assert.match(source, /explicitTables = explicitDatabaseTables\(positivePrompt\)/)
  assert.match(source, /requiredInteractions: unique\(matches\(positivePrompt/)
  assert.match(source, /contentRequirements: unique\(matches\(positivePrompt/)
})

test("negative list bullets cannot accidentally request auth or a services page", () => {
  assert.match(source, /if \(startsNegativeList\) \{[\s\S]*skippingNegativeList = true/)
  assert.match(source, /if \(skippingNegativeList\) \{[\s\S]*\^\[-\*•\]\\s\+/)
})
