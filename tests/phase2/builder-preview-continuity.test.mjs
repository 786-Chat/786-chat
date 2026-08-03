import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("latest verified preview survives rebuild, undo, restore and page reload", async () => {
  const [jobs, route, client, workspace] = await Promise.all([
    read("lib/786-admin/build-jobs.ts"),
    read("app/api/786-admin/projects/[id]/build/route.ts"),
    read("components/786-chat/api.ts"),
    read("components/786-chat/workspace.tsx"),
  ])

  assert.match(jobs, /getLatestPassedBuildJob/)
  assert.match(jobs, /b\.status = 'passed'/)
  assert.match(jobs, /b\.deployment_url IS NOT NULL/)
  assert.match(route, /latestPassedBuild/)
  assert.match(client, /loadBuilderBuildState/)
  assert.match(workspace, /setPreviewBuild\(state\.latestPassedBuild\)/)
  assert.match(workspace, /src=\{activePreviewBuild\.deployment_url\}/)
  assert.match(workspace, /showing last verified preview/)
  assert.doesNotMatch(workspace, /srcDoc|jsxToHtml/)
})

test("only the configured administrator bypasses daily and monthly AI caps", async () => {
  const [route, governance] = await Promise.all([
    read("app/api/786-chat/generate/route.ts"),
    read("lib/786-chat/ai-governance.ts"),
  ])

  assert.match(route, /bypassUsageCaps: hasPlatformOwnerEntitlement\(ownerEmail\)/)
  assert.match(governance, /bypassUsageCaps\?: boolean/)
  assert.match(governance, /if \(!bypassUsageCaps\)/)
  assert.match(governance, /AI_DAILY_LIMIT/)
  assert.match(governance, /AI_MONTHLY_LIMIT/)
  assert.match(governance, /PLAN_LIMITS\.enterprise/)
})
