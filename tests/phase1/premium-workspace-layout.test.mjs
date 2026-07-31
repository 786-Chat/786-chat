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

test("workspace navigation and device controls are functional", async () => {
  const [workspace, contracts, editor] = await Promise.all([
    readFile(workspacePath, "utf8"),
    readFile(new URL("../../components/786-chat/contracts.ts", import.meta.url), "utf8"),
    readFile(new URL("../../lib/786-chat/visual-editor.ts", import.meta.url), "utf8"),
  ])
  for (const label of ["Tasks", "Knowledge", "Data Sources", "Integrations", "Secrets", "Settings", "Logs", "Help & Docs"]) {
    assert.match(workspace, new RegExp(`utilityPanel === "${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`))
  }
  assert.match(workspace, /openDesignEditor/)
  assert.match(workspace, /iphone15/)
  assert.match(contracts, /iPhone 15 Pro/)
  assert.match(contracts, /Google Pixel 8/)
  assert.match(contracts, /Galaxy S24/)
  assert.match(workspace, /scrollbar-width:none/)
  assert.match(editor, /scrollbarStyle/)
})

test("workspace reports real state and contains no Atlas demo project", async () => {
  const workspace = await readFile(workspacePath, "utf8")

  assert.doesNotMatch(workspace, /Atlas Analytics/)
  assert.doesNotMatch(workspace, /24 tests passed/)
  assert.doesNotMatch(workspace, /\$128,430/)
  assert.match(workspace, /build\?\.status === "passed"/)
  assert.match(workspace, /build\.deployment_url/)
})
