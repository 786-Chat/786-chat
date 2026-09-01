import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const overlay = readFileSync(new URL("../../components/786-chat/food-safety-approved-pdf-overlay.tsx", import.meta.url), "utf8")

test("legacy edited PDFs are never promoted to the clean master", () => {
  assert.match(overlay, /const MASTER_VERSION = 2/)
  assert.match(overlay, /masterVersion\?: number/)
  assert.match(overlay, /stored\.masterVersion===MASTER_VERSION&&stored\.masterBlob/)
  assert.doesNotMatch(overlay, /stored\.masterBlob\|\|stored\.blob/)
  assert.match(overlay, /Click Replace PDF once/)
})

test("every apply rebuilds from the trusted clean master", () => {
  assert.match(overlay, /masterVersionRef\.current!==MASTER_VERSION/)
  assert.match(overlay, /applyFoodSafetyBookDetails\(master,details\)/)
  assert.match(overlay, /masterVersion:MASTER_VERSION/)
  assert.match(overlay, /Restore Clean PDF \/ Raja Defaults/)
})
