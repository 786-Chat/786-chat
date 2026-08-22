import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const builderPagePath = new URL("../../app/786.chat/page.tsx", import.meta.url)
const optionalRulesPath = new URL("../../lib/786-admin/optional-feature-rules.ts", import.meta.url)

test("786.Chat dashboard does not mount the Pages manager", async () => {
  const source = await readFile(builderPagePath, "utf8")
  assert.doesNotMatch(source, /BuilderPageManagerOverlay/)
})

test("generated apps use arrows only for navigation overflow", async () => {
  const source = await readFile(optionalRulesPath, "utf8")
  assert.match(source, /1 to 5 visible top-level pages/)
  assert.match(source, /more than 5 visible top-level pages/)
  assert.match(source, /< and > arrow controls/)
  assert.match(source, /Previous pages and Next pages/)
  assert.match(source, /Never add a Pages button, Pages manager/)
})
