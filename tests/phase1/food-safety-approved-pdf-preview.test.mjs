import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import * as ts from "typescript"

const overlay = readFileSync(new URL("../../components/786-chat/food-safety-approved-pdf-overlay.tsx", import.meta.url), "utf8")
const wrapper = readFileSync(new URL("../../components/786-chat/workspace-with-projects-route.tsx", import.meta.url), "utf8")

test("Food Safety workspace mounts the approved PDF exact-view overlay", () => {
  assert.match(wrapper, /FoodSafetyApprovedPdfOverlay/)
  assert.match(overlay, /food-safety-record-book/)
  assert.match(overlay, /Approved PDF - Exact View/)
  assert.match(overlay, /Editable Master Setup/)
  assert.match(overlay, /Raja_Catering_FINAL_197_Page_Record_Book_FOOTER_FIXED\.pdf/)
  assert.match(overlay, /TOTAL_PAGES = 197/)
})

test("approved PDF uses the real PDF blob and IndexedDB rather than redrawing pages", () => {
  assert.match(overlay, /indexedDB\.open/)
  assert.match(overlay, /URL\.createObjectURL/)
  assert.match(overlay, /application\/pdf/)
  assert.match(overlay, /Open Full PDF/)
  assert.match(overlay, /Save PDF Copy/)
  assert.doesNotMatch(overlay, /localStorage\.setItem\([^\n]*pdf/i)
})

test("approved PDF overlay is valid TSX", () => {
  const result = ts.transpileModule(overlay, {
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  })
  const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
  assert.deepEqual(errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")), [])
})
