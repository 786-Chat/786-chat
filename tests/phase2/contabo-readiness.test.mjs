import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import vm from "node:vm"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const source = readFileSync(resolve(root, "lib/786-chat/hosting-readiness.ts"), "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
vm.runInNewContext(compiled, { exports, URL }, { filename: "hosting-readiness.js" })

const { inspectHostingReadiness } = exports
const oldEnv = {
  DATABASE_URL: "postgresql://example/legacy",
  DEEPSEEK_API_KEY: "test-ai",
  GITHUB_BUILD_TOKEN: "test-github",
  BUILD_RUNNER_SECRET: "test-runner",
  VERCEL_TOKEN: "test-vercel",
}
const newEnv = {
  ...oldEnv,
  VERCEL_TOKEN: undefined,
  CONTABO_STAGING_ONLY: "1",
  DATABASE_PROVIDER: "postgres",
  JWT_SECRET: "a".repeat(32),
  COOLIFY_API_TOKEN: "test-coolify",
  COOLIFY_API_URL: "https://coolify.example.test/",
}

test("legacy Vercel readiness stays unchanged outside staging mode", () => {
  const old = inspectHostingReadiness(oldEnv, "ok")
  assert.equal(old.hosting, "vercel")
  assert.equal(old.ready, true)
  assert.equal(inspectHostingReadiness({ ...oldEnv, VERCEL_TOKEN: undefined }, "ok").ready, false)
})

test("Contabo readiness never requires Vercel token but fails closed until verified", () => {
  const baseline = inspectHostingReadiness(newEnv, "ok")
  assert.equal(baseline.hosting, "contabo-staging")
  assert.equal(baseline.ready, false)
  assert.equal(baseline.checks.vercelToken, "missing")
  assert.equal(baseline.checks.generatedDeployments, "not_verified")

  const verified = { ...newEnv, CONTABO_GENERATED_DEPLOYMENTS_READY: "1" }
  assert.equal(inspectHostingReadiness(verified, "ok").ready, true)
  assert.equal(inspectHostingReadiness(verified, "error").ready, false)
  assert.equal(inspectHostingReadiness({ ...verified, JWT_SECRET: "short" }, "ok").ready, false)
  assert.equal(inspectHostingReadiness({ ...verified, COOLIFY_API_URL: "http://insecure.example.test/" }, "ok").ready, false)
  assert.equal(inspectHostingReadiness({ ...verified, COOLIFY_API_TOKEN: undefined }, "ok").ready, false)
})

test("health routes share hosting readiness logic", () => {
  const health = readFileSync(resolve(root, "app/api/health/route.ts"), "utf8")
  const readiness = readFileSync(resolve(root, "app/api/health/ready/route.ts"), "utf8")
  assert.match(health, /inspectHostingReadiness\(process\.env, database\)/)
  assert.match(readiness, /inspectHostingReadiness\(process\.env, database\)/)
})

test("middleware treats localhost as platform and only accepts explicit Contabo staging host", () => {
  const middleware = readFileSync(resolve(root, "middleware.ts"), "utf8")
  assert.ok(middleware.includes('hostname === "127.0.0.1"'))
  assert.match(middleware, /CONTABO_STAGING_HOSTNAME/)
  assert.match(middleware, /hostname === contaboStagingHost/)
  assert.ok(!middleware.includes('hostname.endsWith(".sslip.io")'))
})
