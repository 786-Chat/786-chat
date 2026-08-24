import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const repair = await readFile(new URL("../../lib/786-chat/db-helper-contract-repair.ts", import.meta.url), "utf8")
const architecture = await readFile(new URL("../../lib/786-chat/system-architecture.ts", import.meta.url), "utf8")
const workflow = await readFile(new URL("../../.github/workflows/generated-project-build.yml", import.meta.url), "utf8")

test("generated builds receive a non-secret Blob placeholder and report the latest actionable error", () => {
  assert.match(workflow, /BLOB_READ_WRITE_TOKEN: vercel_blob_rw_786_chat_isolated_build_placeholder/)
  assert.match(workflow, /Invalid environment variables/)
  assert.match(workflow, /Argument of type/)
  assert.match(workflow, /lastActionable/)
})

test("deterministic repair covers Vercel Blob PutBody and dynamic route params compatibility", () => {
  assert.match(repair, /function repairGeneratedBlobPutBody/)
  assert.match(repair, /Uint8Array/)
  assert.match(repair, /PutBody/)
  assert.match(repair, /arrayBuffer/)
  assert.match(repair, /function repairGeneratedDynamicRouteParams/)
  assert.match(repair, /params: Promise/)
  assert.match(repair, /await params/)
})

test("tenant-scoped generation brief protects first-admin setup before database access", () => {
  assert.match(architecture, /Pre-auth setup\/status routes must resolve tenant scope from trusted server-side application context before any database query/)
  assert.match(architecture, /First-admin setup must atomically check and create inside that same tenant/)
  assert.match(architecture, /permanently close first-admin creation once a manager exists/)
})
