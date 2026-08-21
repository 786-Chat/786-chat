import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("generated deployments provision an isolated database before Vercel publish", async () => {
  const [deployer, callback] = await Promise.all([
    read("lib/786-admin/vercel-project-deployer.ts"),
    read("app/api/786-admin/build-runner/callback/route.ts"),
  ])

  assert.match(deployer, /prepareGeneratedRuntimeDatabase/)
  assert.match(deployer, /safeDatabaseName/)
  assert.match(deployer, /FROM pg_database WHERE datname = \$1/)
  assert.match(deployer, /CREATE DATABASE/)
  assert.match(deployer, /url\.pathname = `\/\$\{database\}`/)
  assert.match(deployer, /searchParams\.delete\("options"\)/)
  assert.doesNotMatch(deployer, /CREATE SCHEMA IF NOT EXISTS/)
  assert.doesNotMatch(deployer, /search_path=/)
  assert.match(deployer, /sql\/schema\.sql/)
  assert.match(deployer, /DATABASE_URL/)
  assert.match(deployer, /\/v10\/projects\/\$\{encodeURIComponent\(input\.projectName\)\}\/env/)
  assert.match(deployer, /type:\s*"encrypted"/)
  assert.match(callback, /files:\s*bundle\.files/)
  assert.match(callback, /Generated database namespace prepared/)
})

test("generated auth deployments provision a stable encrypted AUTH_SECRET", async () => {
  const deployer = await read("lib/786-admin/vercel-project-deployer.ts")
  assert.match(deployer, /createHash\("sha256"\)/)
  assert.match(deployer, /generatedAuthSecret/)
  assert.match(deployer, /key:\s*"AUTH_SECRET"/)
  assert.match(deployer, /786\.chat-auth-v1:/)
  assert.match(deployer, /target:\s*\["preview",\s*"production"\]/)
})

test("generated email deployments inherit encrypted Resend runtime configuration", async () => {
  const deployer = await read("lib/786-admin/vercel-project-deployer.ts")
  assert.match(deployer, /generatedUsesEmail/)
  assert.match(deployer, /process\.env\.RESEND_API_KEY/)
  assert.match(deployer, /key:\s*"RESEND_API_KEY"/)
  assert.match(deployer, /key:\s*"EMAIL_FROM"/)
  assert.match(deployer, /AUTH_EMAIL_FROM/)
  assert.match(deployer, /Generated email runtime requires RESEND_API_KEY/)
})

test("first failed generated deployment may reset only its exact isolated database", async () => {
  const deployer = await read("lib/786-admin/vercel-project-deployer.ts")
  assert.match(deployer, /isExactGeneratedDatabase/)
  assert.match(deployer, /!deployed/)
  assert.match(deployer, /DROP DATABASE IF EXISTS/)
  assert.match(deployer, /WITH \(FORCE\)/)
})
