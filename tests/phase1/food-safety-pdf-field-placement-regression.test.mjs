import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pdfEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor.ts", import.meta.url), "utf8")

test("HACCP footer writes approved by and telephone only inside their blank footer slots", () => {
  const start = pdfEditor.indexOf("function paintHaccpPages")
  const end = pdfEditor.indexOf("const DAILY_PRODUCT_BOXES")
  const haccp = pdfEditor.slice(start, end)
  assert.match(haccp, /footerY/)
  assert.match(haccp, /details\.approvedBy/)
  assert.match(haccp, /details\.telephone/)
  assert.doesNotMatch(haccp, /paintCellText\(pages\[4\].*heatTreatmentTarget/s)
})

test("page 13 and 14 address blocks are shifted left only on those two pages", () => {
  const matrixStart = pdfEditor.indexOf("function paintAllergenMatrix")
  const matrixEnd = pdfEditor.indexOf("function paintProcessFlowPage")
  const matrix = pdfEditor.slice(matrixStart, matrixEnd)
  assert.match(matrix, /width - 250/)

  const flowStart = pdfEditor.indexOf("function paintProcessFlowPage")
  const flowEnd = pdfEditor.indexOf("function paintDailyDates")
  const flow = pdfEditor.slice(flowStart, flowEnd)
  assert.match(flow, /width - 245/)
})
