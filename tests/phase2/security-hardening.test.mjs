import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("AI protection is active and fails closed", async () => {
  const protection = await read("lib/ai-protection.ts")
  assert.doesNotMatch(protection, /DISABLED FOR TESTING|TESTING MODE: Always allow/)
  assert.match(protection, /checkUserBlocked/)
  assert.match(protection, /checkRateLimit/)
  assert.match(protection, /checkSpamPatterns/)
  assert.match(protection, /checkBudgetLimits/)
  assert.match(protection, /PROTECTION_UNAVAILABLE/)
})

test("builder prompts are screened before AI usage is reserved", async () => {
  const route = await read("app/api/786-chat/generate/route.ts")
  const screening = route.indexOf("screenBuilderPrompt(prompt)")
  const reservation = route.indexOf("reserveBuilderGeneration({")
  assert.ok(screening > -1 && reservation > screening)
  assert.match(route, /ABUSIVE_PROMPT_BLOCKED|promptSecurity\.code/)
})

test("generated source and builds share security and dependency validation", async () => {
  const generated = await read("lib/786-chat/generated-security.ts")
  const build = await read("lib/786-admin/build-validation.ts")
  const save = await read("app/api/786-chat/projects/[id]/route.ts")
  assert.match(generated, /DANGEROUS_PROCESS_EXECUTION/)
  assert.match(generated, /EMBEDDED_/)
  assert.match(generated, /DEPENDENCY_LIFECYCLE_SCRIPT/)
  assert.match(generated, /DATABASE_ROUTE_WITHOUT_ACCESS_GUARD/)
  assert.match(build, /validateGeneratedSecurity\(files\)/)
  assert.match(save, /validateGeneratedSecurity\(files\)/)
})

test("project secrets are tenant-scoped and encrypted with AES-256-GCM", async () => {
  const security = await read("lib/786-chat/security.ts")
  const route = await read("app/api/786-chat/projects/[id]/secrets/route.ts")
  const migration = await read("lib/786-admin/migrations/008-security-hardening.sql")
  assert.match(security, /aes-256-gcm/)
  assert.match(security, /setAAD/)
  assert.match(route, /getProjectWithData\(id, owner\)/)
  assert.match(route, /project_id = \$\{id\}::uuid AND owner_email = \$\{owner\}/)
  assert.doesNotMatch(route, /decryptProjectSecret/)
  assert.match(migration, /UNIQUE \(project_id, owner_email, name\)/)
})

test("authentication entry points use hashed database rate limits", async () => {
  const security = await read("lib/786-chat/security.ts")
  assert.match(security, /createHmac\("sha256"/)
  assert.match(security, /ON CONFLICT \(namespace, identifier_hash\)/)
  for (const route of [
    "app/api/auth/login/route.ts",
    "app/api/auth/register/route.ts",
    "app/api/auth/forgot-password/route.ts",
    "app/api/auth/resend-verification/route.ts",
    "app/api/auth/reset-password/route.ts",
    "app/api/auth/verify-email/route.ts",
  ]) {
    assert.match(await read(route), /consumeSecurityRateLimit/)
  }
})
