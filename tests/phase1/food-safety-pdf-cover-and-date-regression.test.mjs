import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pdfEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor.ts", import.meta.url), "utf8")

test("cover business name is centered in the crown title area", () => {
  assert.match(pdfEditor, /x: 160, y: 94, width: 275, height: 31/)
  assert.match(pdfEditor, /align: "center"/)
})

test("daily generated date is stamped only once", () => {
  const start = pdfEditor.indexOf("function paintDailyDates")
  const end = pdfEditor.indexOf("function paintDailyPages")
  const dailyDates = pdfEditor.slice(start, end)
  assert.equal((dailyDates.match(/paint(?:Cell)?Text\(/g) || []).length, 1)
  assert.match(dailyDates, /Production Date field only/)
})
