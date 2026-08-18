import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const [repair, provider] = await Promise.all([
  read("lib/786-chat/deterministic-build-repair.ts"),
  read("lib/786-chat/provider-controller.ts"),
])

test("generated Neon serverless code never assumes a pool-style connect method", () => {
  assert.match(provider, /Neon serverless query functions do not expose \.connect\(\)/)
  assert.match(provider, /Do not call getDb\(\)\.connect\(\)/)
})

test("build repair handles the exact NeonQueryFunction connect TypeScript error", () => {
  assert.match(repair, /Property ['\"]connect['\"] does not exist on type ['\"]?NeonQueryFunction/)
  assert.match(repair, /repairNeonConnectUsage/)
  assert.match(repair, /neon-serverless-connect-compatibility/)
})
