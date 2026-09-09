import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("chat edits target text, colour, animation and design without broad replacement", async () => {
  const [intent, surgical] = await Promise.all([
    read("lib/786-chat/edit-intent.ts"),
    read("components/786-chat/surgical-edit.ts"),
  ])

  for (const kind of ["header-colour", "colour", "animation", "design"]) {
    assert.match(intent, new RegExp(`kind: "${kind}"`))
  }
  assert.match(intent, /Targeted colour edit/)
  assert.match(intent, /Targeted animation edit/)
  assert.match(intent, /Targeted design edit/)
  assert.match(intent, /preserve every unrelated route, component, style, data contract and visual-editor state/)
  assert.match(surgical, /totalMatches !== 1/)
  assert.match(surgical, /preserved every other project file/)
})

test("current 786.Chat workspace has real save, rebuild, undo and visual editor actions", async () => {
  const workspace = await read("components/786-chat/workspace.tsx")

  assert.match(workspace, /async function saveCodeChanges\(\)/)
  assert.match(workspace, /saveBuilderCodeEdit/)
  assert.match(workspace, /Save &amp; rebuild/)
  assert.match(workspace, /saveVisualEditorState/)
  assert.match(workspace, /visualSaveQueue/)
  assert.match(workspace, /undoVisualEdit/)
  assert.match(workspace, /redoVisualEdit/)
  assert.match(workspace, /undoLastProjectChange/)
  assert.match(workspace, /restoreBuilderRevision/)
  assert.match(workspace, /queueBuilderBuild/)
  assert.match(workspace, /Changes save automatically and update the preview instantly\. Rebuild before publishing\./)
})

test("current builder deployment uses the verified project deployment API and never the legacy fake publish route", async () => {
  const [workspace, api] = await Promise.all([
    read("components/786-chat/workspace.tsx"),
    read("components/786-chat/api.ts"),
  ])

  assert.match(workspace, /deployBuilderProject/)
  assert.match(workspace, /build\?\.status !== "passed"/)
  assert.match(workspace, /visualDirty/)
  assert.match(workspace, /codeDirty/)
  assert.match(api, /\/api\/786-chat\/projects\/\$\{projectId\}\/deploy/)
  assert.doesNotMatch(api, /your-site\.mujeebproai\.com/)
})
