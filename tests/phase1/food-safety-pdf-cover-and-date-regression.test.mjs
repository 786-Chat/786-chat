import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pdfEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor.ts", import.meta.url), "utf8")

test("cover business name is centered in the crown title area", () => {
  assert.match(pdfEditor, /x: 160, y: 94, width: 275, height: 31/)
  assert.match(pdfEditor, /align: "center"/)
})

test("approved-by and telephone stamping is centralized for pages 1 through 196", () => {
  const start = pdfEditor.indexOf("function paintContactFooters")
  const end = pdfEditor.indexOf("function paintFinalPage")
  const contact = pdfEditor.slice(start, end)
  assert.match(contact, /Page 1 uses the existing decorative Approved By and Telephone areas/)
  assert.match(contact, /for \(let pageNumber = 15; pageNumber <= 196; pageNumber \+= 1\)/)
  assert.match(contact, /Page 197 is intentionally excluded/)
  assert.match(contact, /x: 292, y: 751, width: 96, height: 18/)
  assert.match(contact, /x: 193, y: 790, width: 211, height: 28/)
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
