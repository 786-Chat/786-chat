import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = async (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("Projects navigation opens the dedicated full-page gallery", async () => {
  const [workspaceRoute, page] = await Promise.all([
    source("components/786-chat/workspace-with-projects-route.tsx"),
    source("app/786.chat/projects/page.tsx"),
  ])

  assert.match(workspaceRoute, /\/786\.chat\/projects/)
  assert.match(workspaceRoute, /textContent\?\.trim\(\) !== "Projects"/)
  assert.match(page, /getSession/)
  assert.match(page, /ProjectsGallery/)
})

test("Projects gallery keeps open, preview, metadata and delete actions", async () => {
  const [gallery, contracts] = await Promise.all([
    source("components/786-chat/projects-gallery.tsx"),
    source("components/786-chat/contracts.ts"),
  ])

  assert.match(gallery, /listBuilderProjects/)
  assert.match(gallery, /loadBuilderBuild/)
  assert.match(gallery, /deleteBuilderProject/)
  assert.match(gallery, /786chat_builder_active_project/)
  assert.match(gallery, /Back to Chat/)
  assert.match(gallery, /New project/)
  assert.match(gallery, /saved\.file_count/)
  assert.match(gallery, /saved\.created_at/)
  assert.match(gallery, /saved\.updated_at/)
  assert.match(gallery, /build\.deployment_url/)
  assert.match(contracts, /created_at: string/)
})
