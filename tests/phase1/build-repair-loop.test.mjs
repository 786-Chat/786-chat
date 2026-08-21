import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import ts from "typescript"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

async function loadStandaloneTsModule(path) {
  const source = await read(path)
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`)
}

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

test("builder keeps polling only while an automatic replacement build is genuinely active", async () => {
  const [callback, runnerStore, buildJobs, contracts, workspace] = await Promise.all([
    read("app/api/786-admin/build-runner/callback/route.ts"),
    read("lib/786-admin/build-runner-store.ts"),
    read("lib/786-admin/build-jobs.ts"),
    read("components/786-chat/contracts.ts"),
    read("components/786-chat/workspace.tsx"),
  ])

  assert.match(callback, /repairStatus: runnerBuildFailed \? "pending" : "not_needed"/)
  assert.match(runnerStore, /repair_status = COALESCE/)
  assert.match(buildJobs, /normalizeTerminalPublishRepairState/)
  assert.match(buildJobs, /build\.github_commit_sha/)
  assert.match(contracts, /repair_status:/)
  assert.match(workspace, /repairIsActive/)
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

test("deterministic repair restores the generated signSession auth contract", async () => {
  const { repairMissingGeneratedDbHelper } = await loadStandaloneTsModule("lib/786-chat/db-helper-contract-repair.ts")
  const files = {
    "lib/server/auth.ts": [
      "import { SignJWT } from 'jose';",
      "const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'test-secret');",
      "export async function createSession(userId: string, companyId: string): Promise<string> {",
      "  return new SignJWT({ userId, companyId }).setProtectedHeader({ alg: 'HS256' }).sign(secret);",
      "}",
    ].join("\n"),
    "app/api/auth/login/route.ts": "import { signSession } from '@/lib/server/auth';",
  }
  const logs = `app/api/auth/login/route.ts(4,26): error TS2305: Module '"@/lib/server/auth"' has no exported member 'signSession'.`

  const repaired = repairMissingGeneratedDbHelper(files, logs)
  assert.ok(repaired)
  assert.match(repaired["lib/server/auth.ts"], /export async function signSession\(payload:/)
  assert.match(repaired["lib/server/auth.ts"], /new SignJWT\(\{ userId: payload\.userId/)
  assert.match(repaired["lib/server/auth.ts"], /\.sign\(secret\)/)
})

test("deterministic repair aliases legacy getSessionUser to canonical getCurrentUser", async () => {
  const { repairMissingGeneratedDbHelper } = await loadStandaloneTsModule("lib/786-chat/db-helper-contract-repair.ts")
  const files = {
    "lib/server/auth.ts": [
      "export async function getSessionUser() {",
      "  return { id: 'u1', email: 'user@example.com' };",
      "}",
      "export async function requireUser() {",
      "  const user = await getSessionUser();",
      "  if (!user) throw new Error('Unauthorized');",
      "  return user;",
      "}",
    ].join("\n"),
    "app/admin/[id]/page.tsx": "import { getCurrentUser } from '@/lib/server/auth';",
  }
  const logs = `app/admin/[id]/page.tsx(2,10): error TS2305: Module '"@/lib/server/auth"' has no exported member 'getCurrentUser'.`

  const repaired = repairMissingGeneratedDbHelper(files, logs)
  assert.ok(repaired)
  assert.match(repaired["lib/server/auth.ts"], /export async function getCurrentUser\(\)/)
  assert.match(repaired["lib/server/auth.ts"], /return getSessionUser\(\)/)
})

test("migration records parent builds and safe repair state", async () => {
  const migration = await read("lib/786-admin/migrations/004-build-repair-loop.sql")

  assert.match(migration, /parent_build_id/)
  assert.match(migration, /repair_attempt BETWEEN 0 AND 2/)
  assert.match(migration, /'not_needed','pending','running','repaired','exhausted'/)
})
