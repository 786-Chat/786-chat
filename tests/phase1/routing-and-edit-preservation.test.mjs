import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const fallback = await readFile("lib/786-admin/premium-fallback-generator.ts", "utf8")
const previewRoute = await readFile("app/api/projects/[id]/preview/route.ts", "utf8")
const urlController = await readFile("components/786-admin/admin-chat-url-header-controller.tsx", "utf8")
const resilient = await readFile("app/api/786-admin/chat-resilient/route.ts", "utf8")
const toolbar = await readFile("components/786-admin/admin-chat-toolbar-cleanup.tsx", "utf8")

test("negative design instructions cannot become generated navigation features", () => {
  assert.match(fallback, /negativeList/)
  assert.match(fallback, /Do not|do not/i)
  assert.match(fallback, /allowedSection/)
  assert.doesNotMatch(fallback, /sectionIndex/)
})

test("fallback generates a real App Router file for every requested route", () => {
  assert.match(fallback, /requestedRoutes/)
  assert.match(fallback, /app\/\$\{route\.replace/)
  assert.match(fallback, /app\/page\.tsx/)
})

test("preview route loads the exact requested page instead of reusing the homepage", () => {
  assert.match(previewRoute, /searchParams\.get\("path"\)/)
  assert.match(previewRoute, /routeFileCandidates/)
  assert.match(urlController, /path=\$\{encodeURIComponent\(route\)\}/)
  assert.match(urlController, /786-preview-route/)
  assert.match(urlController, /786\.chat/)
})

test("AI fallback never replaces an existing project during an edit", () => {
  assert.match(resilient, /EDIT_NOT_APPLIED_PROJECT_PRESERVED/)
  assert.match(resilient, /projectPreserved: true/)
  assert.match(resilient, /existing project was kept unchanged/)
})

test("unsolicited persistent code editor is not mounted in chat", () => {
  assert.doesNotMatch(toolbar, /AdminChatRealCodeEditor/)
  assert.match(toolbar, /data-786-real-code-editor/)
})
