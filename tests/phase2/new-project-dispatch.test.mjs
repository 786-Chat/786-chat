import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const route = await readFile(new URL("../../app/api/786-chat/generate/route.ts", import.meta.url), "utf8")
const controller = await readFile(new URL("../../lib/786-chat/provider-controller.ts", import.meta.url), "utf8")

test("named create-app prompts are treated as fresh projects server-side", () => {
  assert.match(route, /isExplicitNewApplicationPrompt\(prompt\)/)
  assert.match(route, /delete payload\.projectId/)
  assert.match(route, /delete payload\.existing/)
  assert.match(route, /application\|app\|website\|system/)
  assert.match(controller, /application\|app\|website\|system/)
})

test("fresh named full-stack apps can reach file-level generation", () => {
  assert.match(controller, /if \(explicitNewProject\) \{ delete payload\.projectId; delete payload\.existing \}/)
  assert.match(controller, /plannedFilesFromPrompt\(String\(payload\.message \|\| ""\)\)\.length > 1/)
})
