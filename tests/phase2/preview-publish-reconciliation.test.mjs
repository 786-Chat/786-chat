import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const callback = readFileSync("app/api/786-admin/build-runner/callback/route.ts", "utf8")
const buildRoute = readFileSync("app/api/786-admin/projects/[id]/build/route.ts", "utf8")
const store = readFileSync("lib/786-admin/build-runner-store.ts", "utf8")
const reconciliation = readFileSync("lib/786-admin/preview-reconciliation.ts", "utf8")

test("publisher checkpoints commit metadata before waiting for Vercel", () => {
  assert.match(callback, /recordRunnerPublishProgress/)
  assert.match(store, /github_commit_sha = \$\{input\.githubCommitSha\}/)
  const checkpointIndex = callback.indexOf("recordRunnerPublishProgress")
  const deployIndex = callback.indexOf("deployGeneratedProjectToVercel")
  assert.ok(checkpointIndex >= 0 && deployIndex >= 0 && checkpointIndex < deployIndex)
})

test("build polling reconciles a READY Vercel preview", () => {
  assert.match(buildRoute, /findReadyGeneratedPreview/)
  assert.match(buildRoute, /status: "passed"/)
  assert.match(buildRoute, /deploymentUrl: ready\.url/)
  assert.match(reconciliation, /readyState \|\| candidate\.state/)
  assert.match(reconciliation, /\.vercel\.app/)
})
