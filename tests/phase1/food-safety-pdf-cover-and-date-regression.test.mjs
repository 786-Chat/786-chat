import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pdfEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor.ts", import.meta.url), "utf8")

test("cover business name is centered in the crown title area", () => {
  assert.match(pdfEditor, /x: 160, y: 94, width: 275, height: 31/)
  assert.match(pdfEditor, /align: "center"/)
})

test("clean cover fills approved-by value and telephone once in the blank areas", () => {
  const start = pdfEditor.indexOf("function paintCover")
  const end = pdfEditor.indexOf("function paintTeamPage")
  const cover = pdfEditor.slice(start, end)
  assert.match(cover, /hasValue\(details, "approvedBy"\)/)
  assert.match(cover, /x: 292, y: 759, width: 96, height: 18/)
  assert.match(cover, /hasValue\(details, "telephone"\)/)
  assert.match(cover, /x: 193, y: 805, width: 211, height: 29/)
  assert.doesNotMatch(cover, /`Approved By: \$\{details\.approvedBy\}`/)
})

test("clean page 2 fills all staff team values from the form", () => {
  const start = pdfEditor.indexOf("function paintTeamPage")
  const end = pdfEditor.indexOf("function paintHaccpPages")
  const team = pdfEditor.slice(start, end)
  assert.match(team, /details\.consultant/)
  assert.match(team, /details\.director/)
  assert.match(team, /details\.preparationStaff/)
  assert.match(team, /details\.storageStaff/)
})

test("daily generated date is stamped only once", () => {
  const start = pdfEditor.indexOf("function paintDailyDates")
  const end = pdfEditor.indexOf("function paintDailyPages")
  const dailyDates = pdfEditor.slice(start, end)
  assert.equal((dailyDates.match(/paint(?:Cell)?Text\(/g) || []).length, 1)
})
