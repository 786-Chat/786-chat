import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pdfEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor.ts", import.meta.url), "utf8")

test("HACCP pages use their real footer-row Y positions instead of one fake shared row", () => {
  assert.match(pdfEditor, /const HACCP_CONTACT_Y: Record<number, number> = \{/)
  assert.match(pdfEditor, /3: 518/)
  assert.match(pdfEditor, /4: 541/)
  assert.match(pdfEditor, /6: 490/)
  assert.match(pdfEditor, /9: 547/)
  assert.match(pdfEditor, /11: 555/)
  assert.match(pdfEditor, /12: 499/)

  const start = pdfEditor.indexOf("function paintContactFooters")
  const end = pdfEditor.indexOf("function paintFinalPage")
  const contact = pdfEditor.slice(start, end)
  assert.match(contact, /const y = HACCP_CONTACT_Y\[pageNumber\]/)
  assert.match(contact, /x: 103, y, width: 100, height: 15/)
  assert.match(contact, /x: 259, y, width: 52, height: 15/)
})

test("page 13 and page 14 contact values use their own existing footer rows", () => {
  const start = pdfEditor.indexOf("function paintContactFooters")
  const end = pdfEditor.indexOf("function paintFinalPage")
  const contact = pdfEditor.slice(start, end)
  assert.match(contact, /x: 82, y: 524, width: 108, height: 15/)
  assert.match(contact, /x: 240, y: 524, width: 40, height: 15/)
  assert.match(contact, /x: 90, y: 792, width: 165, height: 16/)
  assert.match(contact, /x: 355, y: 792, width: 155, height: 16/)
})

test("daily pages 15 through 196 use one consistent left-padded footer placement", () => {
  const start = pdfEditor.indexOf("function paintContactFooters")
  const end = pdfEditor.indexOf("function paintFinalPage")
  const contact = pdfEditor.slice(start, end)
  assert.match(contact, /for \(let pageNumber = 15; pageNumber <= 196; pageNumber \+= 1\)/)
  assert.match(contact, /x: 88, y: 783, width: 175, height: 16/)
  assert.match(contact, /x: 345, y: 783, width: 165, height: 16/)
  assert.match(contact, /Page 197 is intentionally excluded/)
})

test("page 13 and 14 identity blocks remain shifted slightly left", () => {
  const matrixStart = pdfEditor.indexOf("function paintAllergenMatrix")
  const matrixEnd = pdfEditor.indexOf("function paintProcessFlowPage")
  const matrix = pdfEditor.slice(matrixStart, matrixEnd)
  assert.match(matrix, /width - 275/)

  const flowStart = pdfEditor.indexOf("function paintProcessFlowPage")
  const flowEnd = pdfEditor.indexOf("function paintDailyDates")
  const flow = pdfEditor.slice(flowStart, flowEnd)
  assert.match(flow, /width - 270/)
})
