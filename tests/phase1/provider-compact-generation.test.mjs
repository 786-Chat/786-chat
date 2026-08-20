import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const controller = await readFile(
  new URL("../../lib/786-chat/provider-controller.ts", import.meta.url),
  "utf8",
)
const codegen = await readFile(
  new URL("../../lib/786-admin/codegen.ts", import.meta.url),
  "utf8",
)

test("simple websites and complex applications use separate generation profiles", () => {
  assert.match(controller, /type GenerationProfile = "website" \| "full-stack"/)
  assert.match(controller, /const profile: GenerationProfile = isComplex \? "full-stack" : "website"/)
  assert.match(controller, /Generate a compact complete runnable Next\.js App Router website/)
  assert.match(controller, /ULTRA-COMPACT FULL-STACK OUTPUT/)
})

test("complex application terms keep the full-stack generator", () => {
  for (const term of ["database", "erp", "crm", "inventory", "admin dashboard", "authentication"]) {
    assert.ok(controller.includes(`"${term}"`), `missing complex-term guard for ${term}`)
  }
})

test("provider diagnostics classify quota and timeout failures", () => {
  assert.match(controller, /quota_exhausted/)
  assert.match(controller, /timed_out/)
  assert.match(controller, /providerStatus/)
})

test("full-stack generation is file-level, contract-aware and resumable", () => {
  assert.match(controller, /FILE-LEVEL FULL-STACK GENERATION/)
  assert.match(controller, /Generate ONLY the single target file/)
  assert.match(controller, /Use supplied dependency files as authoritative contracts/)
  assert.match(controller, /initialFiles: supplied\?\.completedFiles/)
  assert.match(controller, /continuationRequired: true/)
})

test("existing edits can retry truncated provider output without replacing the entire project", () => {
  assert.match(codegen, /const TRUNCATION_MESSAGE/)
  assert.match(codegen, /compactRetryPrompt/)
  assert.match(codegen, /maxRetries:\s*0/)
})

test("provider calls always receive abort signals and explicit token limits", () => {
  assert.match(controller, /abortSignal: controller\.signal/)
  assert.match(controller, /const maxOutputTokens = isFileUnit \? 8_000/)
})
