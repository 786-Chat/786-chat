import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = async (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("compressed project import bundle is decoded safely", async () => {
  const helper = await source("lib/786-admin/import-bundle.ts")

  assert.match(helper, /IMPORT_BUNDLE_PATH = "\.786-chat-import\.bundle\.json\.gz\.b64"/)
  assert.match(helper, /gunzipSync/)
  assert.match(helper, /Buffer\.from\(encoded, "base64"\)/)
  assert.match(helper, /JSON\.parse/)
  assert.match(helper, /unsafe path/i)
  assert.match(helper, /non-text content/i)
})

test("project file loader expands bundle before normal edit rows", async () => {
  const projects = await source("lib/786-admin/projects.ts")

  assert.match(projects, /expandImportedFileBundle/)
  assert.match(projects, /row\.path !== IMPORT_BUNDLE_PATH/)
  assert.match(projects, /Object\.assign\(map, expandImportedFileBundle\(row\.content\)\)/)
  assert.match(projects, /if \(row\.path === IMPORT_BUNDLE_PATH\) continue/)
  assert.match(projects, /map\[row\.path\] = row\.content/)
})
