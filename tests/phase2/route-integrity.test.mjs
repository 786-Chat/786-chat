import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const specification = await readFile(
  new URL("../../lib/786-chat/specification.ts", import.meta.url),
  "utf8",
)
const validation = await readFile(
  new URL("../../lib/786-chat/validation.ts", import.meta.url),
  "utf8",
)

test("common requested page names become mandatory routes", () => {
  for (const route of ["/services", "/booking", "/gallery", "/faq", "/blog"]) {
    assert.ok(specification.includes(`"${route}"`), `missing page alias for ${route}`)
  }
})

test("validation rejects literal internal links without real page files", () => {
  assert.match(validation, /internalHrefRoutes/)
  assert.match(validation, /href\\s\*=|href\\s\*=/)
  assert.match(validation, /Internal navigation points to missing route/)
  assert.match(validation, /routeFileCandidates\(route\)/)
})

test("route validation ignores external, fragment and static asset destinations", () => {
  assert.match(validation, /!href\.startsWith\("\/"\) \|\| href\.startsWith\("\/\/"\)/)
  assert.match(validation, /split\(\/\[\?#\]\//)
  assert.match(validation, /\\\.\[a-z0-9\]\{2,8\}/i)
})
