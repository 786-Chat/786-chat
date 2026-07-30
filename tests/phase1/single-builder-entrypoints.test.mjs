import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("the product exposes one canonical builder route", async () => {
  const workspace = await read("app/786.chat/page.tsx")
  const legacyAdmin = await read("app/786-admin/chat/page.tsx")
  const legacyChat = await read("app/chat/page.tsx")
  const legacyDashboard = await read("app/dashboard/chat/page.tsx")

  assert.match(workspace, /SevenEightSixWorkspace/)
  assert.match(legacyAdmin, /redirect\("\/786\.chat"\)/)
  assert.match(legacyChat, /redirect\("\/786\.chat"\)/)
  assert.match(legacyDashboard, /redirect\("\/786\.chat"\)/)
})

test("the new workspace calls only the canonical generation endpoint", async () => {
  const api = await read("components/786-chat/api.ts")

  assert.match(api, /\/api\/786-chat\/generate/)
  assert.doesNotMatch(api, /\/api\/786-admin\/chat/)
  assert.doesNotMatch(api, /chat-compact|chat-resilient/)
})

test("legacy dashboard mutation controllers are not mounted", async () => {
  const legacyLayout = await read("app/786-admin/chat/layout.tsx")

  assert.doesNotMatch(legacyLayout, /AdminChat[A-Z]/)
  assert.doesNotMatch(legacyLayout, /MutationObserver/)
})
