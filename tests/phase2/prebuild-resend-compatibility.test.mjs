import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../../", import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), "utf8")
}

test("generated Resend clients are normalized lazily before build", async () => {
  const code = await source("lib/786-chat/resend-compatibility.ts")
  assert.match(code, /new\\s\+Resend/)
  assert.match(code, /process\\\.env\\\.RESEND_API_KEY/)
  assert.match(code, /function getResendClient/)
  assert.match(code, /RESEND_API_KEY is not configured/)
  assert.match(code, /getResendClient\(\)\./)
})

test("provider compatibility runs in the existing confirmed pre-build pass", async () => {
  const compatibility = await source("lib/786-chat/neon-compatibility.ts")
  const buildRoute = await source("app/api/786-admin/projects/[id]/build/route.ts")
  assert.match(compatibility, /normalizeGeneratedResendUsage/)
  assert.match(compatibility, /return normalizeGeneratedResendUsage\(normalizedFiles\)/)

  const normalizeAt = buildRoute.indexOf("normalizeKnownGeneratedCompatibility")
  const validationAt = buildRoute.lastIndexOf("const validation = validateGeneratedProject")
  const dispatchAt = buildRoute.indexOf("dispatchGeneratedProjectBuild({")
  assert.ok(normalizeAt >= 0)
  assert.ok(validationAt > normalizeAt)
  assert.ok(dispatchAt > validationAt)
})
