import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const canonical = await readFile("app/api/786-chat/generate/route.ts", "utf8")
const validation = await readFile("lib/786-chat/validation.ts", "utf8")
const resilient = await readFile("lib/786-chat/provider-controller.ts", "utf8")
const workspace = await readFile("components/786-chat/workspace.tsx", "utf8")

test("unverified generated routes cannot be accepted", () => {
  assert.match(canonical, /validateGeneratedProject/)
  assert.match(canonical, /status:\s*422/)
  assert.match(validation, /Missing requested route/)
})

test("canonical workspace previews only the compiled deployment", () => {
  assert.match(workspace, /src=\{activePreviewBuild\.deployment_url\}/)
  assert.doesNotMatch(workspace, /srcDoc|jsxToHtml/)
})

test("AI fallback never replaces an existing project during an edit", () => {
  assert.match(resilient, /EDIT_NOT_APPLIED_PROJECT_PRESERVED/)
  assert.match(resilient, /projectPreserved: true/)
  assert.match(resilient, /existing project was kept unchanged/)
})

test("code is hidden until the user opens code view", () => {
  assert.match(workspace, /showCode/)
  assert.match(workspace, /setShowCode/)
})

test("edit validation merges proposed files with the complete existing project", () => {
  assert.match(canonical, /const existingFiles/)
  assert.match(canonical, /\.\.\.existingFiles,\s*\.\.\.generatedFiles/s)
  assert.match(canonical, /keyFiles/)
})
