import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pdfEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor.ts", import.meta.url), "utf8")

test("cover business name is centered in the crown title area", () => {
  assert.match(pdfEditor, /x: 160, y: 94, width: 275, height: 31/)
  assert.match(pdfEditor, /align: "center"/)
})

test("cover does not restamp the preprinted approver name or telephone", () => {
  const start = pdfEditor.indexOf("function paintCover")
  const end = pdfEditor.indexOf("function paintTeamPage")
  const cover = pdfEditor.slice(start, end)
  assert.doesNotMatch(cover, /hasValue\(details, "telephone"\)/)
  assert.doesNotMatch(cover, /hasValue\(details, "approvedBy"\)/)
  assert.doesNotMatch(cover, /Approved By:/)
  assert.match(cover, /already contains the approved-by name and telephone number/i)
})

test("page 2 does not restamp static team names already printed in approved artwork", () => {
  const start = pdfEditor.indexOf("function paintTeamPage")
  const end = pdfEditor.indexOf("function paintHaccpPages")
  const team = pdfEditor.slice(start, end)
  assert.match(team, /businessName/)
  assert.doesNotMatch(team, /details\.consultant/)
  assert.doesNotMatch(team, /details\.director/)
  assert.doesNotMatch(team, /details\.preparationStaff/)
  assert.doesNotMatch(team, /details\.storageStaff/)
})

test("HACCP pages keep the real approved-by field but do not duplicate name and phone in footer", () => {
  const start = pdfEditor.indexOf("function paintHaccpPages")
  const end = pdfEditor.indexOf("const DAILY_PRODUCT_BOXES")
  const haccp = pdfEditor.slice(start, end)
  assert.match(haccp, /details\.approvedBy/)
  assert.doesNotMatch(haccp, /x: 98, y:/)
  assert.doesNotMatch(haccp, /details\.telephone/)
  assert.match(haccp, /decorative footer/i)
})

test("daily generated date is stamped only once", () => {
  const start = pdfEditor.indexOf("function paintDailyDates")
  const end = pdfEditor.indexOf("function paintDailyPages")
  const dailyDates = pdfEditor.slice(start, end)
  assert.equal((dailyDates.match(/paint(?:Cell)?Text\(/g) || []).length, 1)
  assert.match(dailyDates, /Production Date field only/)
})
