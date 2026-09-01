import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pdfEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor.ts", import.meta.url), "utf8")
const baseEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor-base.ts", import.meta.url), "utf8")

test("HACCP pages keep their real page-specific footer Y positions", () => {
  assert.match(pdfEditor, /const HACCP_CONTACT_Y: Record<number, number> = \{/)
  assert.match(pdfEditor, /3: 518/)
  assert.match(pdfEditor, /4: 541/)
  assert.match(pdfEditor, /6: 490/)
  assert.match(pdfEditor, /9: 547/)
  assert.match(pdfEditor, /11: 555/)
  assert.match(pdfEditor, /12: 499/)
})

test("pages 2 through 12 place values on the printed lines to the right of labels", () => {
  const start = pdfEditor.indexOf("function paintContactFooters")
  const end = pdfEditor.indexOf("export async function applyFoodSafetyBookDetails")
  const contact = pdfEditor.slice(start, end)
  assert.match(contact, /x: 120, y: 747, width: 160, height: 14/)
  assert.match(contact, /x: 362\.5, y: 747, width: 117\.5, height: 14/)
  assert.match(contact, /x: 122\.5, y, width: 130, height: 14/)
  assert.match(contact, /x: 340\.5, y, width: 107, height: 14/)
})

test("page 13 uses the actual allergen-footer line starts", () => {
  const start = pdfEditor.indexOf("function paintContactFooters")
  const end = pdfEditor.indexOf("export async function applyFoodSafetyBookDetails")
  const contact = pdfEditor.slice(start, end)
  assert.match(contact, /x: 105\.5, y: 523, width: 130, height: 14/)
  assert.match(contact, /x: 323\.5, y: 523, width: 107, height: 14/)
})

test("daily pages 15 through 196 stay on their existing footer lines and page 197 remains excluded", () => {
  const start = pdfEditor.indexOf("function paintContactFooters")
  const end = pdfEditor.indexOf("export async function applyFoodSafetyBookDetails")
  const contact = pdfEditor.slice(start, end)
  assert.match(contact, /for \(let pageNumber = 15; pageNumber <= 196; pageNumber \+= 1\)/)
  assert.match(contact, /x: 92, y: 784, width: 153, height: 13/)
  assert.match(contact, /x: 343, y: 784, width: 162, height: 13/)
  assert.match(contact, /Page 197 is intentionally excluded/)
})

test("page 13 and 14 identity blocks remain shifted slightly left in the base editor", () => {
  const matrixStart = baseEditor.indexOf("function paintAllergenMatrix")
  const matrixEnd = baseEditor.indexOf("function paintProcessFlowPage")
  const matrix = baseEditor.slice(matrixStart, matrixEnd)
  assert.match(matrix, /width - 275/)

  const flowStart = baseEditor.indexOf("function paintProcessFlowPage")
  const flowEnd = baseEditor.indexOf("function paintDailyDates")
  const flow = baseEditor.slice(flowStart, flowEnd)
  assert.match(flow, /width - 270/)
})
