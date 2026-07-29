import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("workspace queues an isolated build after persistence", async () => {
  const api = await read("components/786-chat/api.ts")
  const workspace = await read("components/786-chat/workspace.tsx")

  assert.match(api, /\/api\/786-chat\/projects\/\$\{projectId\}\/build/)
  assert.match(workspace, /queueBuilderBuild/)
  assert.match(workspace, /loadBuilderBuild/)
  assert.match(workspace, /async function retryBuild/)
  assert.match(workspace, /Retry build/)
  assert.match(workspace, /queueBuilderBuild\(project\.id\)/)
})

test("runtime preview is displayed only from a passed deployment URL", async () => {
  const workspace = await read("components/786-chat/workspace.tsx")

  assert.match(workspace, /build\?\.status === "passed" && build\.deployment_url/)
  assert.match(workspace, /src=\{build\.deployment_url\}/)
  assert.doesNotMatch(workspace, /srcDoc|Babel\.transform|regex.*jsx/i)
})

test("build runner APIs authenticate before the admin session middleware", async () => {
  const middleware = await read("middleware.ts")
  const workflow = await read(".github/workflows/generated-project-build.yml")
  const dispatcher = await read("lib/786-admin/build-runner.ts")

  assert.match(middleware, /pathname\.startsWith\("\/api\/786-admin\/build-runner\/"\)/)
  assert.match(middleware, /request\.headers\.get\("authorization"\) !== `Bearer \$\{runnerSecret\}`/)
  assert.match(middleware, /if \(isBuildRunnerApi\)[\s\S]*return NextResponse\.next\(\)/)
  assert.equal(
    workflow.match(/x-vercel-protection-bypass: \$\{RUNNER_SECRET:32:32\}/g)?.length,
    2,
  )
  assert.match(dispatcher, /process\.env\.VERCEL_GIT_COMMIT_REF/)
  assert.doesNotMatch(dispatcher, /agent\/phase-3-publishing-v2/)
})
