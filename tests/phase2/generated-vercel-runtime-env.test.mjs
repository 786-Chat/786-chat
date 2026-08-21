import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const deployer = readFileSync("lib/786-admin/vercel-project-deployer.ts", "utf8")
const runtimeEnvironment = readFileSync("lib/786-admin/generated-runtime-environment.ts", "utf8")

test("generated projects receive a stable isolated auth secret", () => {
  assert.match(runtimeEnvironment, /createHmac\("sha256", authSecretSeed\(\)\)/)
  assert.match(runtimeEnvironment, /786\.chat-generated-auth\\0\$\{projectId\}/)
  assert.match(runtimeEnvironment, /environment\.AUTH_SECRET = derivedAuthSecret\(input\.projectId\)/)
})

test("saved project secrets are decrypted only for their owning project", () => {
  assert.match(runtimeEnvironment, /FROM builder_project_secrets/)
  assert.match(runtimeEnvironment, /project_id = \$\{projectId\}::uuid/)
  assert.match(runtimeEnvironment, /owner_email = \$\{ownerEmail\}/)
  assert.match(runtimeEnvironment, /decryptProjectSecret/)
  assert.match(runtimeEnvironment, /\$\{projectId\}:\$\{ownerEmail\}:\$\{row\.name\}:v1/)
})

test("platform mail credentials are inherited only by owner generated projects", () => {
  assert.match(runtimeEnvironment, /isAdminUser\(ownerEmail\)/)
  assert.match(runtimeEnvironment, /process\.env\.RESEND_API_KEY/)
  assert.match(runtimeEnvironment, /process\.env\.EMAIL_FROM/)
})

test("Vercel publisher provisions runtime environment before deployment", () => {
  assert.match(deployer, /prepareGeneratedRuntimeEnvironment/)
  const prepareIndex = deployer.indexOf("prepareGeneratedRuntimeEnvironment")
  const upsertIndex = deployer.indexOf("upsertRuntimeEnvironment({ projectName, environment")
  const deployIndex = deployer.indexOf('new URL("https:\/\/api.vercel.com\/v13\/deployments")')
  assert.ok(prepareIndex >= 0 && upsertIndex >= 0 && deployIndex >= 0)
  assert.ok(prepareIndex < upsertIndex && upsertIndex < deployIndex)
  assert.match(deployer, /Object\.entries\(input\.environment\)/)
  assert.match(deployer, /target: \["preview", "production"\]/)
})
