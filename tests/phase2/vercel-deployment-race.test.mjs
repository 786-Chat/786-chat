import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const deployer = await readFile(
  new URL("../../lib/786-admin/vercel-project-deployer.ts", import.meta.url),
  "utf8",
)
const callback = await readFile(
  new URL("../../app/api/786-admin/build-runner/callback/route.ts", import.meta.url),
  "utf8",
)
const workflow = await readFile(
  new URL("../../.github/workflows/generated-project-build.yml", import.meta.url),
  "utf8",
)

test("Vercel deployment retries the temporary missing-branch race", () => {
  assert.match(deployer, /GIT_REF_RETRY_ATTEMPTS = 5/)
  assert.match(deployer, /isTransientGitRefError/)
  assert.match(deployer, /ref\\b\.\+\\bdoes not exist/)
  assert.match(deployer, /attempt <= GIT_REF_RETRY_ATTEMPTS/)
  assert.match(deployer, /await wait\(GIT_REF_RETRY_DELAY_MS\)/)
})

test("the callback and runner allow the bounded retry and readiness window", () => {
  assert.match(callback, /maxDuration = 120/)
  assert.match(workflow, /--max-time 115/)
})
