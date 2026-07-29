import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = async (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("projects and revisions use canonical workspace APIs", async () => {
  const [api, workspace] = await Promise.all([
    source("components/786-chat/api.ts"),
    source("components/786-chat/workspace.tsx"),
  ])
  assert.match(api, /\/api\/786-chat\/projects/)
  assert.match(api, /\/revisions\/\$\{revisionId\}\/restore/)
  assert.doesNotMatch(api, /\/api\/786-admin/)
  assert.match(workspace, /listBuilderProjects/)
  assert.match(workspace, /restoreBuilderRevision/)
})

test("deployment requires a passed build for the current source version", async () => {
  const [publishing, deployRoute, publicRoute] = await Promise.all([
    source("lib/786-admin/publishing.ts"),
    source("app/api/786-chat/projects/[id]/deploy/route.ts"),
    source("app/p/[slug]/[[...path]]/route.ts"),
  ])
  assert.match(publishing, /status = 'passed'/)
  assert.match(publishing, /source_version = \$\{version\}/)
  assert.match(publishing, /runtime_url/)
  assert.match(deployRoute, /publishCompiledProject/)
  assert.match(publicRoute, /deployment\.runtime_url/)
  assert.match(publicRoute, /NextResponse\.redirect/)
})
