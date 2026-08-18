import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const repair = await read("lib/786-chat/deterministic-build-repair.ts")

test("build repair handles the exact NeonQueryFunction connect TypeScript error", () => {
  assert.match(repair, /Property ['\"]connect['\"] does not exist on type ['\"]?NeonQueryFunction/)
  assert.match(repair, /repairNeonConnectUsage/)
  assert.match(repair, /neon-serverless-connect-compatibility/)
  assert.match(repair, /\.release\\s\*\\\(/)
})
