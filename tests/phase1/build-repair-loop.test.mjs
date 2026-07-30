import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("failed isolated builds enter a bounded repair loop", async () => {
  const [callback, repair] = await Promise.all([
    read("app/api/786-admin/build-runner/callback/route.ts"),
    read("lib/786-chat/build-repair.ts"),
  ])

  assert.match(callback, /runnerBuildFailed/)
  assert.match(callback, /repairFailedBuild/)
  assert.match(repair, /MAX_REPAIR_ATTEMPTS = 2/)
  assert.match(repair, /repairAttempt >= MAX_REPAIR_ATTEMPTS/)
  assert.match(repair, /repair_status = 'exhausted'/)
})

test("repair uses exact logs, snapshots a revision, validates, and rebuilds", async () => {
  const repair = await read("lib/786-chat/build-repair.ts")

  assert.match(repair, /BUILD OUTPUT:/)
  assert.match(repair, /admin_project_revisions/)
  assert.match(repair, /validateGeneratedProject\(merged\)/)
  assert.match(repair, /parentBuildId: context\.buildId/)
  assert.match(repair, /dispatchGeneratedProjectBuild/)
})

test("repair deterministically migrates unsupported TypeScript Next config", async () => {
  const repair = await read("lib/786-chat/build-repair.ts")

  assert.match(repair, /deterministicCompatibilityRepair/)
  assert.match(repair, /"next\.config\.mjs"/)
  assert.match(repair, /removedPaths: \["next\.config\.ts"\]/)
  assert.match(repair, /DELETE FROM admin_project_files/)
  assert.match(repair, /context\.buildId\}::text/)
  assert.match(repair, /model\}::text/)
})

test("migration records parent builds and safe repair state", async () => {
  const migration = await read("lib/786-admin/migrations/004-build-repair-loop.sql")

  assert.match(migration, /parent_build_id/)
  assert.match(migration, /repair_attempt BETWEEN 0 AND 2/)
  assert.match(migration, /'not_needed','pending','running','repaired','exhausted'/)
})
