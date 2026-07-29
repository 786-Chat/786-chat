import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("the composable design catalogue contains twenty complete families", async () => {
  const source = await read("lib/786-chat/design-system.ts")
  const familyCount = (source.match(/family\("/g) || []).length - 1

  assert.equal(familyCount, 20)
  for (const field of [
    "navigation",
    "hero",
    "composition",
    "typography",
    "spacing",
    "cards",
    "borders",
    "background",
    "motion",
    "mobile",
    "footer",
  ]) {
    assert.match(source, new RegExp(`${field}:`))
  }
})

test("new projects receive a seeded family while edits can retain project identity", async () => {
  const analyser = await read("lib/786-chat/specification.ts")
  const route = await read("app/api/786-chat/generate/route.ts")

  assert.match(analyser, /selectDesignFamily\(seed, designDirection\)/)
  assert.match(route, /payload\.projectId/)
  assert.match(route, /crypto\.randomUUID\(\)/)
  assert.match(route, /designFamilyBrief/)
  assert.match(route, /do not treat this as a fixed template/)
})
