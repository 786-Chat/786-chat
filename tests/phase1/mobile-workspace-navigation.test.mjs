import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = async (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("mobile workspace exposes requested navigation and view actions", async () => {
  const menu = await source("components/786-chat/mobile-workspace-menu.tsx")
  const page = await source("app/786.chat/page.tsx")

  for (const label of [
    "786.Chat · Start work",
    "Overview",
    "Projects",
    "Chat",
    "Preview",
    "Code",
    "Rebuild",
    "Restore",
    "Royal Fusion",
    "Undo",
    "Deploy",
    "New project",
  ]) {
    assert.match(menu, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  }

  assert.match(menu, /Show AI Agent/)
  assert.match(menu, /Show live preview/)
  assert.match(menu, /Show project code/)
  assert.match(menu, /data-786-publish/)
  assert.match(page, /MobileWorkspaceMenu/)
})
