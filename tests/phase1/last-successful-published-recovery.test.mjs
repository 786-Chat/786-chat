import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = async (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("published recovery is scoped to the last accepted merged source", async () => {
  const recovery = await source("lib/786-admin/published-source-recovery.ts")

  assert.match(recovery, /LAST_SUCCESSFUL_PUBLISHED_REVISION_ID = "last-successful-published"/)
  assert.match(recovery, /b\.status = 'passed'/)
  assert.match(recovery, /b\.github_commit_sha IS NOT NULL/)
  assert.match(recovery, /b\.deployment_url IS NOT NULL/)
  assert.match(recovery, /MAX_BUILD_CANDIDATES = 50/)
  assert.match(recovery, /isCommitMergedIntoBase/)
  assert.match(recovery, /compare\.status === "ahead" \|\| compare\.status === "identical"/)
  assert.match(recovery, /getBaseBranchCommitSha/)
  assert.match(recovery, /acceptedCommitSha/)
  assert.match(recovery, /generated-projects\/\$\{segment\}\//)
  assert.match(recovery, /relative === "\.786-chat-build\.json"/)
  assert.match(recovery, /GITHUB_BUILD_TOKEN/)
  assert.match(recovery, /\/git\/trees\/\$\{encodeURIComponent\(commitSha\)\}\?recursive=1/)
  assert.match(recovery, /\/git\/blobs\/\$\{encodeURIComponent\(entry\.sha\)\}/)
})

test("published recovery rejects unmerged generated previews", async () => {
  const recovery = await source("lib/786-admin/published-source-recovery.ts")

  assert.match(recovery, /successful preview deployment is not necessarily an accepted\/published project/i)
  assert.match(recovery, /Ignore generated draft\/unmerged preview commits/i)
  assert.match(recovery, /No successful merged published build is available for recovery/)
  assert.match(recovery, /Recover the current accepted base-branch project tree/)
})

test("published recovery replaces builder files atomically and preserves a safety revision", async () => {
  const [recovery, restoreRoute] = await Promise.all([
    source("lib/786-admin/published-source-recovery.ts"),
    source("app/api/786-admin/projects/[id]/revisions/[revisionId]/restore/route.ts"),
  ])

  assert.match(recovery, /DELETE FROM admin_project_files WHERE project_id = \$\{projectId\}/)
  assert.match(recovery, /INSERT INTO admin_project_files/)
  assert.match(recovery, /await transaction\(queries\)/)
  assert.match(restoreRoute, /Before last-successful published recovery/)
  assert.match(restoreRoute, /source: "restore-safety"/)
  assert.match(restoreRoute, /recoverLastSuccessfulPublishedSource/)
})

test("restore queues exactly one rebuild through the canonical workspace", async () => {
  const [restoreRoute, workspace] = await Promise.all([
    source("app/api/786-admin/projects/[id]/revisions/[revisionId]/restore/route.ts"),
    source("components/786-chat/workspace.tsx"),
  ])

  assert.doesNotMatch(restoreRoute, /queueRevisionRebuild/)
  assert.match(restoreRoute, /rebuildRequired: true/)
  assert.match(workspace, /queueBuilderBuild\(restored\.project\.id\)/)
})

test("revisions API exposes recovery through the existing Restore UI", async () => {
  const route = await source("app/api/786-admin/projects/[id]/revisions/route.ts")

  assert.match(route, /getLastSuccessfulPublishedBuild/)
  assert.match(route, /lastSuccessfulPublishedRevision/)
  assert.match(route, /\[recoveryRevision, \.\.\.revisions/)
})
