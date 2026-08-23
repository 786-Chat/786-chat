import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = async (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("Settings hides the clean-project shortcut", async () => {
  const css = await source("components/786-chat/workspace-theme.module.css")
  assert.match(css, /utility-panel-title/)
  assert.match(css, /button:nth-of-type\(3\)/)
  assert.match(css, /New projects are created from the dedicated New project\/Projects flow/)
})
