import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const refresh = await readFile("components/786-admin/admin-chat-preview-refresh-controller.tsx", "utf8")
const routeBar = await readFile("components/786-admin/admin-chat-url-header-controller.tsx", "utf8")
const previewApi = await readFile("app/api/projects/[id]/preview/route.ts", "utf8")

test("preview controller never automatically restores an older srcdoc after iframe load", () => {
  assert.doesNotMatch(refresh, /completedInitialLoad/)
  assert.doesNotMatch(refresh, /handlePreviewLoad/)
  assert.doesNotMatch(refresh, /restoreProjectPreview/)
  assert.doesNotMatch(refresh, /about:blank/)
})

test("route bar loads saved pages directly and prevents concurrent reloads", () => {
  assert.match(routeBar, /preview\?raw=1&path=/)
  assert.match(routeBar, /previewRoutePending/)
  assert.match(routeBar, /previewProject/)
  assert.doesNotMatch(routeBar, /routeBaseSrcdoc/)
})

test("preview API selects the requested app-router page", () => {
  assert.match(previewApi, /function routeFileCandidates/)
  assert.match(previewApi, /searchParams\.get\("path"\)/)
  assert.match(previewApi, /getPageCode\(files, route\)/)
})
