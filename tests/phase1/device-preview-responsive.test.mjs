import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = async (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("device selector includes current iPhone, iPad and Android presets", async () => {
  const contracts = await source("components/786-chat/contracts.ts")
  for (const label of [
    "iPhone 16 Pro Max",
    "iPhone 16 Pro",
    "iPhone 15 Pro Max",
    "iPhone 14",
    "iPhone 13",
    "iPhone SE",
    "iPad Air",
    "iPad mini",
    "Google Pixel 9 Pro",
    "Google Pixel 8",
    "Galaxy S25 Ultra",
    "Galaxy S24",
    "Galaxy A55",
    "OnePlus 12",
    "Custom size",
  ]) assert.match(contracts, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
})

test("generated web applications are required to be mobile responsive", async () => {
  const rules = await source("lib/786-admin/multi-platform-generator-rules.ts")
  assert.match(rules, /RESPONSIVE WEB APPLICATION OUTPUT/)
  assert.match(rules, /320px through large desktop widths/)
  assert.match(rules, /Wide data tables must be placed inside a dedicated horizontal overflow container/)
  assert.match(rules, /Pages must naturally scroll vertically/)
  assert.match(rules, /375px, 393px, 412px, 768px and 1366px/)
})

test("preview iframe keeps touch scrolling and selected viewport fit", async () => {
  const css = await source("components/786-chat/workspace-theme.module.css")
  assert.match(css, /compiled preview/)
  assert.match(css, /touch-action: pan-x pan-y/)
  assert.match(css, /max-width: 100%/)
  assert.match(css, /overscroll-behavior: contain/)
})
