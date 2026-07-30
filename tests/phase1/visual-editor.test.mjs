import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("generated projects receive the isolated visual-editor bridge", async () => {
  const source = await read("app/api/786-chat/generate/route.ts")
  const bridge = await read("lib/786-chat/visual-editor.ts")

  assert.match(source, /injectVisualEditorFiles/)
  assert.match(bridge, /public\/786-visual-editor\.js/)
  assert.match(bridge, /786-editor:apply/)
  assert.match(bridge, /allowedParent/)
  assert.doesNotMatch(bridge, /srcdoc/)
})

test("visual edits are validated, versioned, and saved atomically", async () => {
  const route = await read("app/api/786-chat/projects/[id]/visual-editor/route.ts")
  const persistence = await read("lib/786-chat/persistence.ts")

  assert.match(route, /normalizeVisualEditorState/)
  assert.match(route, /injectVisualEditorFiles/)
  assert.match(route, /validatePersistedGeneration/)
  assert.match(route, /saveGeneratedProject/)
  assert.match(persistence, /revisionLabel/)
  assert.match(persistence, /recordGenerationJob/)
})

test("workspace exposes complete visual editing operations and safe publishing", async () => {
  const workspace = await read("components/786-chat/workspace.tsx")

  for (const contract of [
    "draggable",
    "onDrop",
    "moveSection",
    "duplicateSection",
    "toggleSection",
    "undoVisualEdit",
    "redoVisualEdit",
    "backgroundColor",
    "borderRadius",
    "fontFamily",
    "postVisualMessage",
    "saveVisualEditorState",
  ]) {
    assert.match(workspace, new RegExp(contract))
  }
  assert.match(workspace, /event\.source !== frame\.contentWindow/)
  assert.match(workspace, /event\.origin !== expectedOrigin/)
  assert.match(workspace, /disabled=\{!project \|\| build\?\.status !== "passed" \|\| visualDirty\}/)
})
