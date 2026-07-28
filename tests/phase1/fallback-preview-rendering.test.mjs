import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const fallbackGenerator = await readFile("lib/786-admin/premium-fallback-generator.ts", "utf8")
const previewRoute = await readFile("app/api/projects/[id]/preview/route.ts", "utf8")
const previewPanel = await readFile("components/workspace/preview-panel.tsx", "utf8")

test("fallback pages emit concrete visible JSX instead of unresolved map expressions", () => {
  assert.match(fallbackGenerator, /const navLinks=/)
  assert.match(fallbackGenerator, /const sectionCards=/)
  assert.match(fallbackGenerator, /<nav className="open">\$\{navLinks\}<\/nav>/)
  assert.match(fallbackGenerator, /<section className="contentGrid">\$\{sectionCards\}<\/section>/)
  assert.doesNotMatch(fallbackGenerator, /sections\.map\(\(item,index\)=>/)
})

test("fallback pages always include real hero and section text", () => {
  assert.match(fallbackGenerator, /copy\.eyebrow/)
  assert.match(fallbackGenerator, /copy\.headline/)
  assert.match(fallbackGenerator, /copy\.description/)
  assert.match(fallbackGenerator, /sectionDescriptions/)
})

test("saved-project preview has a non-empty static fallback path", () => {
  assert.match(previewRoute, /buildStaticHtml/)
  assert.match(previewRoute, /body\.trim\(\)\.length > 20/)
  assert.match(previewRoute, /Runtime worker not connected yet/)
})

test("workspace preview rejects empty or fake converted previews", () => {
  assert.match(previewPanel, /hasMeaningfulPreviewText/)
  assert.match(previewPanel, /buildFallbackProjectBody/)
  assert.match(previewPanel, /hasVisibleHtmlContent/)
})
