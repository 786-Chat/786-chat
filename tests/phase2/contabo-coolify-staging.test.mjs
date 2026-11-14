import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import vm from "node:vm"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const path = resolve(dirname(fileURLToPath(import.meta.url)), "../../lib/786-admin/coolify-staging-deployer.ts")
const source = readFileSync(path, "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function fixture(staging = true) {
  const exports = {}
  const requests = []
  const request = async (url, options) => {
    requests.push({ url: String(url), ...options })
    return { ok: true, status: 201, json: async () => ({ uuid: "c0olify-staging-12345" }) }
  }
  vm.runInNewContext(compiled, {
    exports, URL, AbortSignal, fetch: request, process: { env: staging ? {
      CONTABO_STAGING_ONLY: "1", DATABASE_PROVIDER: "postgres",
    } : {} },
  }, { filename: "coolify-staging-deployer.js" })
  return { ...exports, requests, request }
}

function config() {
  return {
    apiOrigin: "https://coolify.example.test/",
    apiToken: "test-token-very-long",
    projectUuid: "project-123",
    serverUuid: "server-456",
    environmentName: "production",
    repository: "https://github.com/786-Chat/786-chat",
    branch: "contabo-staging-db-adapter-20261114",
    commitSha: "a".repeat(40),
    generatedProjectId: "22c299f8-bf65-410f-9643-92a9776dbfca",
  }
}

test("Coolify generated app provisioning is staging-only and never deploys", async () => {
  const api = fixture()
  const result = await api.createCoolifyStagingApplication(config(), api.request)
  assert.equal(result.uuid, "c0olify-staging-12345")
  assert.equal(api.requests.length, 1)
  const [call] = api.requests
  assert.equal(call.url, "https://coolify.example.test/api/v1/applications/public")
  assert.equal(call.method, "POST")
  const body = JSON.parse(call.body)
  assert.equal(body.instant_deploy, false)
  assert.equal(body.is_auto_deploy_enabled, false)
  assert.equal(body.git_commit_sha, "a".repeat(40))
  assert.equal(body.base_directory, "generated-projects/22c299f8-bf65-410f-9643-92a9776dbfca")
  assert.equal(body.environment_name, "production")
  assert.equal(body.ports_exposes, "3000")
  assert.ok(!JSON.stringify(body).includes("test-token"))
  assert.ok(!call.url.includes("/deploy"))
})

test("Coolify staging request refuses missing staging flags and insecure origins", async () => {
  const inactive = fixture(false)
  await assert.rejects(
    () => inactive.createCoolifyStagingApplication(config(), inactive.request),
    /explicit staging environment flags/,
  )
  assert.equal(inactive.requests.length, 0)
  const active = fixture()
  await assert.rejects(
    () => active.createCoolifyStagingApplication({ ...config(), apiOrigin: "http://server.example.test/" }, active.request),
    /must use HTTPS/,
  )
  assert.equal(active.requests.length, 0)
})

test("Coolify rejects invalid project IDs, Git refs, and unexpected responses", async () => {
  const api = fixture()
  assert.throws(
    () => api.coolifyStagingPayload({ ...config(), generatedProjectId: "../production" }),
    /Invalid generated project/,
  )
  assert.throws(
    () => api.coolifyStagingPayload({ ...config(), commitSha: "main" }),
    /exact 40-character/,
  )
  const failedRequest = async () => ({ ok: false, status: 401 })
  await assert.rejects(
    () => api.createCoolifyStagingApplication(config(), failedRequest),
    /HTTP 401/,
  )
})
