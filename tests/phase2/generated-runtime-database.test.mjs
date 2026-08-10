import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("generated deployments provision database runtime before Vercel publish", async () => {
  const [deployer, callback] = await Promise.all([
    read("lib/786-admin/vercel-project-deployer.ts"),
    read("app/api/786-admin/build-runner/callback/route.ts"),
  ])

  assert.match(deployer, /prepareGeneratedRuntimeDatabase/)
  assert.match(deployer, /CREATE SCHEMA IF NOT EXISTS/)
  assert.match(deployer, /sql\/schema\.sql/)
  assert.match(deployer, /DATABASE_URL/)
  assert.match(deployer, /\/v10\/projects\/\$\{encodeURIComponent\(input\.projectName\)\}\/env/)
  assert.match(deployer, /type:\s*"encrypted"/)
  assert.match(callback, /files:\s*bundle\.files/)
  assert.match(callback, /Generated database namespace prepared/)
})
