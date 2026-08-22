import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const builderPagePath = new URL("../../app/786.chat/page.tsx", import.meta.url)
const optionalRulesPath = new URL("../../lib/786-admin/optional-feature-rules.ts", import.meta.url)

test("786.Chat dashboard does not mount the Pages manager", async () => {
  const source = await readFile(builderPagePath, "utf8")
  assert.doesNotMatch(source, /BuilderPageManagerOverlay/)
})

test("generated apps add previous and next arrows when more than one customer page exists", async () => {
  const source = await readFile(optionalRulesPath, "utf8")
  assert.match(source, /only one visible top-level customer page/)
  assert.match(source, /two or more visible top-level customer pages/)
  assert.match(source, /< and > controls inside each generated page header/)
  assert.match(source, /previous visible top-level customer page/)
  assert.match(source, /next visible top-level customer page/)
  assert.match(source, /Previous page and Next page/)
  assert.match(source, /must not paginate, hide, replace, delete, rename, or recreate/)
  assert.match(source, /Never add a Pages button, Pages manager/)
})
