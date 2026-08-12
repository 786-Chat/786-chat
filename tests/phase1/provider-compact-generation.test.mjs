import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const resilient = await readFile(
  new URL("../../lib/786-chat/provider-controller.ts", import.meta.url),
  "utf8",
)
const codegen = await readFile(
  new URL("../../lib/786-admin/codegen.ts", import.meta.url),
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

test("truncated existing-project edits get one compact DeepSeek retry", () => {
  assert.match(codegen, /const TRUNCATION_MESSAGE/)
  assert.match(codegen, /function compactRetryPrompt/)
  assert.match(codegen, /RETRY AFTER OUTPUT LIMIT/)
  assert.match(codegen, /if \(!truncated \|\| !input\.existing\) throw error/)
  assert.match(codegen, /runDeepSeek\(input, compactRetryPrompt\(prompt\), mode\)/)
  assert.match(codegen, /Return ONLY the smallest set of files directly changed by the current user request/)
})

test("existing edits do not require unchanged root page output", () => {
  assert.match(codegen, /app\/page\.tsx is mandatory for new projects; for existing-project edits/)
  assert.match(codegen, /return it only when the requested change actually modifies it/)
})
