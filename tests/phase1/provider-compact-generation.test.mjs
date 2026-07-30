import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const resilient = await readFile(
  new URL("../../lib/786-chat/provider-controller.ts", import.meta.url),
  "utf8",
)

test("simple text-only websites use the compact generation profile", () => {
  assert.match(resilient, /isSimpleWebsiteRequest/)
  assert.match(resilient, /compactEligible && providerForMode\(mode\) === "deepseek"/)
  assert.match(resilient, /COMPACT WEBSITE PROFILE/)
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

test("compact generation requires real routes and rejects generic design", () => {
  assert.match(resilient, /real page file for every requested route/i)
  assert.match(resilient, /Do not use generic 786 artwork, placeholder copy, or a repeated template/)
  assert.match(resilient, /"compact-website"/)
})
