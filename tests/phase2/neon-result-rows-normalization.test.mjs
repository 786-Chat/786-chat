import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../../", import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), "utf8")
}

test("pre-build Neon normalizer covers pg-style result.rows and result.rowCount usage", async () => {
  const code = await source("lib/786-chat/neon-compatibility.ts")
  assert.match(code, /resultVariables/)
  assert.match(code, /\.rows\\b/)
  assert.match(code, /\.rowCount\\b/)
  assert.match(code, /`\$\{resultVariable\}\.length`/)
  assert.match(code, /get\(\?:Sql\|Db\)/)
  assert.match(code, /neonVariables/)
  assert.match(code, /row arrays directly/)
})

test("Neon normalizer runs before confirmed builds", async () => {
  const code = await source("app/api/786-admin/projects/[id]/build/route.ts")
  const normalizeAt = code.indexOf("normalizeKnownGeneratedCompatibility")
  const validationAt = code.lastIndexOf("const validation = validateGeneratedProject")
  const dispatchAt = code.indexOf("dispatchGeneratedProjectBuild({")
  assert.ok(normalizeAt >= 0)
  assert.ok(validationAt > normalizeAt)
  assert.ok(dispatchAt > validationAt)
})
