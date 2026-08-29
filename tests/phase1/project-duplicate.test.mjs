import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = async (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("duplicate endpoint creates a new project from source files without copying conversation history", async () => {
  const route = await source("app/api/786-chat/projects/[id]/duplicate/route.ts")

  assert.match(route, /getProjectWithData\(id, session\.email\)/)
  assert.match(route, /files: \{ \.\.\.source\.files \}/)
  assert.match(route, /previewState: \{ \.\.\.\(source\.preview_state \|\| \{\}\) \}/)
  assert.match(route, /duplicated_from_project_id: source\.id/)
  assert.match(route, /messages: \[\]/)
  assert.match(route, /recordGenerationJob: false/)
})

test("projects gallery exposes a visible duplicate action and starts a separate build", async () => {
  const gallery = await source("components/786-chat/projects-gallery.tsx")

  assert.match(gallery, /title="Duplicate project"/)
  assert.match(gallery, /duplicateBuilderProject\(project\.id\)/)
  assert.match(gallery, /queueBuilderBuild\(duplicated\.projectId\)/)
  assert.match(gallery, /Duplicate created, but its first build could not start/)
})
