import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import * as ts from "typescript"

const template = readFileSync(new URL("../../lib/786-chat/templates/food-safety-template.ts", import.meta.url), "utf8")
const route = readFileSync(new URL("../../app/api/786-chat/templates/food-safety/route.ts", import.meta.url), "utf8")
const launcher = readFileSync(new URL("../../components/786-chat/food-safety-template-launcher.tsx", import.meta.url), "utf8")
const projectPage = readFileSync(new URL("../../app/786.chat/projects/page.tsx", import.meta.url), "utf8")
const appPartSources = Array.from({ length: 7 }, (_, index) =>
  readFileSync(new URL(`../../lib/786-chat/templates/food-safety-app-part-${index + 1}.ts`, import.meta.url), "utf8"),
)
const cssPartSources = Array.from({ length: 3 }, (_, index) =>
  readFileSync(new URL(`../../lib/786-chat/templates/food-safety-css-part-${index + 1}.ts`, import.meta.url), "utf8"),
)

function decodeExportedString(source) {
  const marker = " = "
  const start = source.indexOf(marker)
  assert.notEqual(start, -1)
  return JSON.parse(source.slice(start + marker.length).trim())
}

const generatedApp = appPartSources.map(decodeExportedString).join("")
const generatedCss = cssPartSources.map(decodeExportedString).join("")
const completeTemplateSource = `${template}\n${generatedApp}\n${generatedCss}`

test("food-safety starter is a separate reusable 197-page project template", () => {
  assert.match(template, /FOOD_SAFETY_TEMPLATE_ID = "food-safety-record-book"/)
  assert.match(template, /page_count: 197/)
  assert.match(template, /week_count: 26/)
  assert.match(template, /daily_page_count: 182/)
  assert.match(completeTemplateSource, /businessName/)
  assert.match(completeTemplateSource, /assessmentDate/)
  assert.match(completeTemplateSource, /reviewDate/)
  assert.match(completeTemplateSource, /bookStartDate/)
  assert.match(completeTemplateSource, /products/)
  assert.match(completeTemplateSource, /ingredients/)
  assert.match(completeTemplateSource, /allergens/)
  assert.match(completeTemplateSource, /localStorage/)
  assert.match(completeTemplateSource, /Print \/ Save PDF/)
  assert.match(template, /new_customer/)
  assert.match(template, /renewal/)
})

test("generated Food Safety Book component is valid TSX source", () => {
  const result = ts.transpileModule(generatedApp, {
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  })
  const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
  assert.deepEqual(errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")), [])
  assert.match(generatedCss, /\.cooked-grid/)
  assert.match(generatedCss, /\.page-footer/)
  assert.match(generatedCss, /bottom: 17px/)
})

test("one global date change feeds every HACCP sheet and the full 26-week daily date run", () => {
  assert.match(generatedApp, /Date of Assessment/)
  assert.match(generatedApp, /displayDate\(settings\.assessmentDate\)/)
  assert.match(generatedApp, /displayDate\(settings\.reviewDate\)/)
  assert.match(generatedApp, /addDays\(settings\.bookStartDate, dayIndex\)/)
  assert.match(generatedApp, /DAILY_PAGE_COUNT = 182/)
})

test("food-safety template route creates a new project without editing an existing one", () => {
  assert.match(route, /saveGeneratedProjectAtomic/)
  assert.match(route, /recordGenerationJob: false/)
  assert.doesNotMatch(route, /projectId:/)
  assert.match(route, /PROJECT_LIMIT_REACHED/)
  assert.match(route, /foodSafetyRecordBookFiles/)
})

test("food-safety launcher queues the first build and opens the created project", () => {
  assert.match(launcher, /\/api\/786-chat\/templates\/food-safety/)
  assert.match(launcher, /queueBuilderBuild/)
  assert.match(launcher, /786chat_builder_active_project/)
  assert.match(launcher, /router\.push\("\/786\.chat"\)/)
  assert.match(launcher, /does not alter your existing Raja Catering Operations Platform/)
})

test("projects page exposes the reusable Food Safety Book creator", () => {
  assert.match(projectPage, /\/786\.chat\/food-safety-book/)
  assert.match(projectPage, /Food Safety Book/)
})
