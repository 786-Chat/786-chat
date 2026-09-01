import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pdfEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor.ts", import.meta.url), "utf8")
const baseEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor-base.ts", import.meta.url), "utf8")

test("cover business name remains centered in the crown title area", () => {
  assert.match(baseEditor, /x: 160, y: 94, width: 275, height: 31/)
  assert.match(baseEditor, /align: "center"/)
})

test("cover approved-by is lowered into the cream bar and telephone is lowered below its heading", () => {
  const start = pdfEditor.indexOf("function paintContactFooters")
  const end = pdfEditor.indexOf("export async function applyFoodSafetyBookDetails")
  const contact = pdfEditor.slice(start, end)
  assert.match(contact, /x: 292, y: 758, width: 96, height: 18/)
  assert.match(contact, /x: 193, y: 798, width: 211, height: 27/)
  assert.match(contact, /Page 197 is intentionally excluded/)
})

test("clean page 2 still fills all staff team values from the base editor", () => {
  const start = baseEditor.indexOf("function paintTeamPage")
  const end = baseEditor.indexOf("function paintHaccpPages")
  const team = baseEditor.slice(start, end)
  assert.match(team, /details\.consultant/)
  assert.match(team, /details\.director/)
  assert.match(team, /details\.preparationStaff/)
  assert.match(team, /details\.storageStaff/)
})

test("daily generated date remains stamped only once by the base editor", () => {
  const start = baseEditor.indexOf("function paintDailyDates")
  const end = baseEditor.indexOf("function paintDailyPages")
  const dailyDates = baseEditor.slice(start, end)
  assert.equal((dailyDates.match(/paint(?:Cell)?Text\(/g) || []).length, 1)
})
