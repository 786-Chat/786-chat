import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("existing-project ZIP import creates a new isolated builder project without touching saved projects", async () => {
  const [route, importer, page] = await Promise.all([
    read("app/api/786-chat/import/route.ts"),
    read("components/786-chat/project-import.ts"),
    read("components/786-chat/import-existing-project-page.tsx"),
  ])

  assert.match(route, /createProject\(session\.email/)
  assert.match(route, /builderPlanUsage/)
  assert.match(route, /requires_compatibility_review:\s*true/)
  assert.match(route, /requires_security_review:\s*true/)
  assert.match(route, /blockedSecretPath/)
  assert.match(route, /upsertFiles\(projectId, files\)/)
  assert.doesNotMatch(route, /deleteProject/)

  assert.match(importer, /0x06054b50/)
  assert.match(importer, /DecompressionStream/)
  assert.match(importer, /\/api\/upload/)
  assert.match(importer, /migration\/asset-map\.json/)
  assert.match(importer, /action:\s*"finalize"/)
  assert.doesNotMatch(importer, /queueBuilderBuild/)

  assert.match(page, /Creates a brand-new project/)
  assert.match(page, /Existing Raja Catering and other saved projects are not changed/)
  assert.match(page, /Import as new project/)
})
