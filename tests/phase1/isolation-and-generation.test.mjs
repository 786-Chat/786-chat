import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8")
}

test("preview storage guard never restores same-origin access", async () => {
  const file = await source("components/786-admin/admin-chat-preview-storage-guard.tsx")
  assert.match(file, /permission\) => permission !== "allow-same-origin"/)
  assert.doesNotMatch(file, /\[\.\.\.current,\s*"allow-same-origin"\]/)
})

test("projects page keeps preview iframes origin-isolated", async () => {
  const file = await source("app/786-admin/projects/page.tsx")
  assert.doesNotMatch(file, /allow-same-origin/)
})

test("project deletion does not use a blocking browser confirmation", async () => {
  const file = await source("app/786-admin/projects/page.tsx")
  assert.doesNotMatch(file, /window\.confirm\s*\(/)
})

test("recent project cards are not injected into the customer preview workspace", async () => {
  const file = await source("app/786-admin/chat/layout.tsx")
  assert.doesNotMatch(file, /AdminChatRecentProjects/)
})

test("local fallback has multiple layouts and industry-specific pizza content", async () => {
  const file = await source("lib/786-admin/premium-fallback-generator.ts")
  const layouts = file.match(/"(?:storefront|poster|mosaic|split|editorial|catalogue|story|command)"/g) || []
  assert.ok(new Set(layouts).size >= 8, "expected at least eight distinct fallback layouts")
  assert.match(file, /pizza\|restaurant\|cafe\|bakery/)
  assert.match(file, /Signature pizzas/)
  assert.match(file, /Explore the menu/)
})
