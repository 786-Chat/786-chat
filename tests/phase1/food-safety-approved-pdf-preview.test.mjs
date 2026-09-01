import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import * as ts from "typescript"

const overlay = readFileSync(new URL("../../components/786-chat/food-safety-approved-pdf-overlay.tsx", import.meta.url), "utf8")
const wrapper = readFileSync(new URL("../../components/786-chat/workspace-with-projects-route.tsx", import.meta.url), "utf8")
const pdfEditor = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor.ts", import.meta.url), "utf8")
const pdfEditorBase = readFileSync(new URL("../../lib/786-chat/food-safety-pdf-editor-base.ts", import.meta.url), "utf8")
const completePdfEditor = `${pdfEditor}\n${pdfEditorBase}`

test("Food Safety workspace mounts the approved PDF-only overlay", () => {
  assert.match(wrapper, /FoodSafetyApprovedPdfOverlay/)
  assert.match(overlay, /food-safety-record-book/)
  assert.match(overlay, /Approved 197-page PDF - Exact View/)
  assert.match(overlay, /Raja_Catering_FINAL_197_Page_Record_Book_FINAL_CLEAN\.pdf/)
  assert.match(overlay, /TOTAL_PAGES = 197/)
  assert.doesNotMatch(overlay, /Editable Master Setup/)
})

test("repaired Raja Catering Food Safety project is recognized even when template metadata is missing", () => {
  assert.match(overlay, /fd542697-fb5b-46c6-8435-7276a05e2e0e/)
  assert.match(overlay, /food\\s\+safety\\s\+record\\s\+book/i)
  assert.match(overlay, /food-safety-book\|approved-pdf-mode/)
})

test("approved PDF uses the real PDF blob and IndexedDB rather than redrawing pages", () => {
  assert.match(overlay, /indexedDB\.open/)
  assert.match(overlay, /URL\.createObjectURL/)
  assert.match(overlay, /application\/pdf/)
  assert.match(overlay, /Open Full PDF/)
  assert.match(overlay, /Save PDF Copy/)
  assert.match(overlay, /old recreated HTML book is no longer shown/i)
  assert.doesNotMatch(overlay, /localStorage\.setItem\([^\n]*pdf/i)
})

test("PDF customer edits stamp text only and do not cover approved borders or artwork", () => {
  assert.match(pdfEditor, /Text-only stamping/)
  assert.match(pdfEditor, /page\.drawText/)
  assert.doesNotMatch(pdfEditor, /drawRectangle/)
  assert.match(pdfEditor, /never let text cross a printed border/i)
})

test("complete PDF form values still stamp through the base editor plus corrected contact overlay", () => {
  assert.match(completePdfEditor, /function hasValue/)
  assert.doesNotMatch(completePdfEditor, /function changed/)
  assert.doesNotMatch(completePdfEditor, /JSON\.stringify\(details\[key\]\)/)
  assert.match(pdfEditorBase, /paintTeamPage\(pages\[1\]/)
  assert.match(pdfEditorBase, /paintAllergenMatrix\(pages\[12\]/)
  assert.match(pdfEditorBase, /paintProcessFlowPage\(pages\[13\]/)
  assert.match(pdfEditorBase, /details\.products\.slice\(0, 9\)\.forEach/)
  assert.doesNotMatch(pdfEditorBase, /ALLERGEN_MATRIX_PRODUCT_INDEX/)
  assert.match(pdfEditorBase, /if \(start\) \{/)
  assert.match(pdfEditor, /applyBaseFoodSafetyBookDetails/)
  assert.match(pdfEditor, /approvedBy: ""/)
  assert.match(pdfEditor, /telephone: ""/)
})

test("edited PDF hides the internal master title from Chrome Open Full PDF toolbar", () => {
  assert.match(pdfEditor, /const HIDDEN_VIEWER_TITLE = "\\u200B"/)
  assert.match(pdfEditor, /document\.setTitle\(HIDDEN_VIEWER_TITLE\)/)
  assert.doesNotMatch(pdfEditor, /Raja Catering - Approved 197 Page Empty Master - Border Fixed/)
})

test("real PDF page fills the live preview and keeps the PDF native orientation", () => {
  assert.match(overlay, /view=Fit/)
  assert.match(overlay, /zoom=page-fit/)
  assert.match(overlay, /width: "100%"/)
  assert.match(overlay, /height: "100%"/)
  assert.match(overlay, /native landscape HACCP pages/i)
})

function assertValidTypeScript(source, label) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  })
  const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
  assert.deepEqual(
    errors.map((diagnostic) => `${label}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`),
    [],
  )
}

test("approved PDF editor files are valid TypeScript", () => {
  assertValidTypeScript(pdfEditor, "wrapper")
  assertValidTypeScript(pdfEditorBase, "base")
})
