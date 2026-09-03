import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const callback = readFileSync("app/api/786-admin/build-runner/callback/route.ts", "utf8")
const buildRoute = readFileSync("app/api/786-admin/projects/[id]/build/route.ts", "utf8")
const store = readFileSync("lib/786-admin/build-runner-store.ts", "utf8")
const publisher = readFileSync("lib/786-admin/github-project-publisher.ts", "utf8")
const reconciliation = readFileSync("lib/786-admin/preview-reconciliation.ts", "utf8")

test("publisher checkpoints commit metadata before waiting for Vercel", () => {
  assert.match(callback, /recordRunnerPublishProgress/)
  assert.match(store, /github_commit_sha = \$\{input\.githubCommitSha\}/)
  const checkpointIndex = callback.indexOf("recordRunnerPublishProgress")
  const deployIndex = callback.indexOf("deployGeneratedProjectToVercel")
  assert.ok(checkpointIndex >= 0 && deployIndex >= 0 && checkpointIndex < deployIndex)
})

test("identical source retries reuse prior GitHub publish metadata", () => {
  assert.match(store, /getReusableRunnerPublish/)
  assert.match(store, /source_version = \$\{input\.sourceVersion\}/)
  assert.match(store, /id <> \$\{input\.excludeBuildId\}/)
  assert.match(callback, /getReusableRunnerPublish/)
  assert.match(callback, /reusablePublish \?\? await publishGeneratedProjectToGitHub/)
  assert.match(callback, /skipped duplicate GitHub upload/)
})

test("GitHub publisher backs off on secondary rate limits", () => {
  assert.match(publisher, /GITHUB_REQUEST_ATTEMPTS = 4/)
  assert.match(publisher, /isRetryableGitHubLimit/)
  assert.match(publisher, /secondary rate limit/)
  assert.match(publisher, /retry-after/)
  assert.match(publisher, /x-ratelimit-reset/)
})

test("build polling reconciles a READY Vercel preview", () => {
  assert.match(buildRoute, /findGeneratedPreviewState/)
  assert.match(buildRoute, /preview\?\.state === "READY"/)
  assert.match(buildRoute, /status: "passed"/)
  assert.match(buildRoute, /deploymentUrl: preview\.url/)
  assert.match(reconciliation, /readyState \|\| item\.state/)
  assert.match(reconciliation, /\.vercel\.app/)
})

test("build polling converts terminal Vercel preview states into a failed build", () => {
  assert.match(buildRoute, /TERMINAL_PREVIEW_FAILURE_STATES/)
  assert.match(buildRoute, /"ERROR", "CANCELED", "CANCELLED"/)
  assert.match(buildRoute, /status: "failed"/)
  assert.match(buildRoute, /Vercel preview deployment finished with state/)
  assert.match(reconciliation, /state: string/)
})

test("preview publishing cannot remain running forever", () => {
  assert.match(buildRoute, /PREVIEW_PUBLISH_TIMEOUT_MS = 5 \* 60 \* 1000/)
  assert.match(buildRoute, /Preview publishing timed out before Vercel reached a terminal state/)
  assert.match(buildRoute, /Date\.parse\(build\.updated_at\)/)
})
