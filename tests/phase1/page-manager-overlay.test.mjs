import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const overlayPath = new URL("../../components/786-chat/page-manager-overlay.tsx", import.meta.url)
const builderPagePath = new URL("../../app/786.chat/page.tsx", import.meta.url)

test("builder mounts page navigation manager", async () => {
  const builderPage = await readFile(builderPagePath, "utf8")
  assert.match(builderPage, /BuilderPageManagerOverlay/)
  assert.match(builderPage, /<SevenEightSixWorkspace \/>/)
})

test("page manager exposes move hide show and safe remove controls", async () => {
  const overlay = await readFile(overlayPath, "utf8")

  for (const label of [
    "Pages &amp; navigation",
    "Move page left in navigation",
    "Move page right in navigation",
    "Show",
    "Hide",
    "Remove",
    "Required auth pages are protected",
  ]) {
    assert.match(overlay, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  }

  assert.match(overlay, /generateBuilderProject/)
  assert.match(overlay, /saveBuilderProject/)
  assert.match(overlay, /queueBuilderBuild/)
  assert.match(overlay, /page_manager/)
  assert.match(overlay, /Do not delete database tables, API routes, stored customer data/)
  assert.match(overlay, /Keep the page route, page files, API routes, database tables and all existing data intact/)
})

test("required routes cannot be removed by the page manager", async () => {
  const overlay = await readFile(overlayPath, "utf8")
  for (const route of ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]) {
    assert.match(overlay, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  }
  assert.match(overlay, /disabled=\{Boolean\(busyRoute\) \|\| page\.protected\}/)
})
