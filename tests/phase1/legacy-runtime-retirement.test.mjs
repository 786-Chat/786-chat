import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("active workspace does not depend on legacy fallback or preview conversion", async () => {
  const [workspace, api, generation] = await Promise.all([
    read("components/786-chat/workspace.tsx"),
    read("components/786-chat/api.ts"),
    read("app/api/786-chat/generate/route.ts"),
  ])

  assert.doesNotMatch(workspace, /srcDoc|jsxToHtml|premium-fallback-generator/)
  assert.doesNotMatch(api, /chat-compact|chat-resilient|\/api\/projects\/.*preview/)
  assert.match(generation, /fellBackToLocal === true/)
  assert.match(generation, /status:\s*503/)
})

test("legacy UI entry points only redirect to the canonical workspace", async () => {
  const routes = await Promise.all([
    read("app/786-admin/chat/page.tsx"),
    read("app/chat/page.tsx"),
    read("app/dashboard/chat/page.tsx"),
  ])

  for (const route of routes) {
    assert.match(route, /redirect\("\/786\.chat"\)/)
  }
})

test("legacy generation endpoints only re-export the canonical route", async () => {
  const routes = await Promise.all([
    read("app/api/786-admin/chat/route.ts"),
    read("app/api/786-admin/chat-compact/route.ts"),
    read("app/api/786-admin/chat-resilient/route.ts"),
  ])

  for (const route of routes) {
    assert.match(route, /app\/api\/786-chat\/generate\/route/)
    assert.doesNotMatch(route, /generateProjectCode|premium-fallback-generator/)
  }
})

test("root layout does not inject legacy preview controllers or Babel", async () => {
  const layout = await read("app/layout.tsx")

  assert.doesNotMatch(layout, /AdminChat|srcdoc|Babel|unpkg|cdn\.tailwindcss/)
  assert.doesNotMatch(layout, /dangerouslySetInnerHTML/)
  assert.match(layout, /786\.Chat – Build production applications with AI/)
})
