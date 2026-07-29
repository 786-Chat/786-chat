import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const workspacePath = new URL("../../components/786-chat/workspace.tsx", import.meta.url)

test("canonical builder implements the approved premium workspace structure", async () => {
  const workspace = await readFile(workspacePath, "utf8")

  for (const label of [
    "Agent Flow",
    "Analyse",
    "Plan",
    "Build",
    "Verify",
    "Deploy",
    "Live preview",
    "Build sandbox",
    "Revisions",
    "Hide bottom panel",
  ]) {
    assert.match(workspace, new RegExp(label))
  }

  assert.match(workspace, /aria-label="Resize AI panel"/)
  assert.match(workspace, /BUILDER_DEVICES/)
  assert.match(workspace, /setShowCode/)
  assert.match(workspace, /Thinking &amp; analysing/)
  assert.match(workspace, /stage-flow/)
  assert.match(workspace, /bottom-6 left-\[22px\] top-6/)
  assert.match(workspace, /last:mb-0/)
  assert.doesNotMatch(workspace, /h-\[320px\]/)
  assert.doesNotMatch(workspace, /bottom-12 left-\[23px\] top-5/)
})

test("workspace reports real state and contains no Atlas demo project", async () => {
  const workspace = await readFile(workspacePath, "utf8")

  assert.doesNotMatch(workspace, /Atlas Analytics/)
  assert.doesNotMatch(workspace, /24 tests passed/)
  assert.doesNotMatch(workspace, /\$128,430/)
  assert.match(workspace, /build\?\.status === "passed"/)
  assert.match(workspace, /build\.deployment_url/)
})
