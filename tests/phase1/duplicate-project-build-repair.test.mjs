import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("duplicate endpoint accepts an explicit project name without changing source ownership", async () => {
  const source = await read("app/api/786-chat/projects/[id]/duplicate/route.ts")
  assert.match(source, /requestedDuplicateTitle/)
  assert.match(source, /body\.title/)
  assert.match(source, /duplicated_from_project_id: source\.id/)
  assert.match(source, /files: \{ \.\.\.source\.files \}/)
  assert.match(source, /messages: \[\]/)
})

test("Projects page asks for the duplicate name before creating the copy", async () => {
  const source = await read("components/786-chat/projects-gallery.tsx")
  assert.match(source, /New project name/)
  assert.match(source, /Create duplicate/)
  assert.match(source, /duplicateBuilderProject\(project\.id, cleanTitle\)/)
})

test("isolated generated builds synchronize stale npm lockfiles before npm ci", async () => {
  const workflow = await read(".github/workflows/generated-project-build.yml")
  assert.match(workflow, /Synchronize npm lockfile for generated source/)
  assert.match(workflow, /npm install --package-lock-only --ignore-scripts --no-audit --no-fund/)
  assert.match(workflow, /npm ci --ignore-scripts/)
})
