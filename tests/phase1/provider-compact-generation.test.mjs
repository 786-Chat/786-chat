import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const resilientPath = new URL("../../app/api/786-admin/chat-resilient/route.ts", import.meta.url)
const compactPath = new URL("../../app/api/786-admin/chat-compact/route.ts", import.meta.url)

const [resilient, compact] = await Promise.all([
  readFile(resilientPath, "utf8"),
  readFile(compactPath, "utf8"),
])

test("simple text-only websites use the compact DeepSeek route", () => {
  assert.match(resilient, /isSimpleWebsiteRequest/)
  assert.match(resilient, /runCompactGenerator/)
  assert.match(resilient, /compactEligible && providerForMode\(mode\) === "deepseek"/)
})

test("complex application terms keep the full platform generator", () => {
  for (const term of ["database", "erp", "iot", "mqtt", "mobile app", "admin dashboard"]) {
    assert.ok(resilient.includes(`"${term}"`), `missing complex-term guard for ${term}`)
  }
})

test("provider diagnostics classify quota and timeout failures", () => {
  assert.match(resilient, /quota_exhausted/)
  assert.match(resilient, /timed_out/)
  assert.match(resilient, /providerStatus/)
})

test("compact generation requires real route files and rejects generic fallback design", () => {
  assert.match(compact, /every requested app\/<route>\/page\.tsx file/i)
  assert.match(compact, /Do not default to purple, generic 786 artwork, placeholder text or a repeated template/)
  assert.match(compact, /generationProfile: "compact-website"/)
})
