import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const importer = readFileSync("components/786-chat/project-import.ts", "utf8")

test("Replit asset imports use only the exact matching uploaded file", () => {
  assert.match(importer, /const exactUrl = assetMap\[expected\]/)
  assert.match(importer, /exact imported asset/)
  assert.doesNotMatch(importer, /managedImages\[fallbackIndex/)
  assert.doesNotMatch(importer, /fallbackIndex \+= 1/)
})

test("missing Replit assets are never silently replaced by another archive image", () => {
  assert.match(importer, /Never substitute a different archive image/)
  assert.match(importer, /if \(!sourcePaths\.has\(expected\)\) return statement/)
  assert.match(importer, /Missing assets are never substituted with unrelated files/)
})
