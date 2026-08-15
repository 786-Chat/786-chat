import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const [route, client, security] = await Promise.all([
  read("app/api/786-chat/generate/route.ts"),
  read("components/786-chat/api.ts"),
  read("lib/786-chat/generated-security.ts"),
])

test("continuation provider failures preserve the same signed progress for bounded retry", () => {
  assert.match(route, /MAX_CONTINUATION_PROVIDER_RETRIES\s*=\s*2/)
  assert.match(route, /retryableContinuation:\s*true/)
  assert.match(route, /continuationToken:\s*String\(payload\.continuationToken/)
  assert.match(route, /recordBuilderGenerationProgress/)
  assert.match(client, /MAX_RETRIES_PER_CONTINUATION\s*=\s*2/)
  assert.match(client, /payload\.retryableContinuation\s*===\s*true/)
  assert.match(client, /continuationRetryCount/)
})

test("validation repair is planned as resumable file-level generation", () => {
  assert.match(route, /VALIDATION-GUIDED REPAIR — FILE-BY-FILE AND RESUMABLE/)
  assert.match(route, /`Planned files: \$\{requiredRepairFiles\.join\("[,] "\)\}`/)
  assert.match(route, /_fileContinuation:\s*repairSeed/)
  assert.match(route, /generationBrief:\s*repairBrief/)
  assert.match(route, /repairPass:\s*1/)
  assert.match(route, /repaired\.continuationRequired\s*===\s*true/)
})

test("auth bootstrap endpoints are excluded from existing-session database guard", () => {
  assert.match(security, /PUBLIC_AUTH_BOOTSTRAP_ROUTE/)
  assert.match(security, /register\|login\|forgot-password\|reset-password\|verify-email/)
  assert.match(security, /!PUBLIC_AUTH_BOOTSTRAP_ROUTE\.test\(normalizedPath\)/)
  assert.match(security, /DATABASE_ROUTE_WITHOUT_ACCESS_GUARD/)
})

test("large projects have enough bounded continuation rounds without one giant request", () => {
  assert.match(client, /MAX_GENERATION_CONTINUATIONS\s*=\s*60/)
  assert.match(route, /Return every planned file with complete content/)
  assert.match(route, /Generate the repair one file at a time/)
})
