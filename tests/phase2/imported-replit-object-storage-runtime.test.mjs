import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const helper = readFileSync("lib/786-admin/runtime-deployment-files.ts", "utf8")

test("imported Replit object storage is adapted to Vercel Blob at deployment time", () => {
  assert.match(helper, /patchImportedReplitObjectStorage/)
  assert.match(helper, /REPLIT_SIDECAR_ENDPOINT/)
  assert.match(helper, /PUBLIC_OBJECT_SEARCH_PATHS/)
  assert.match(helper, /"@vercel\/blob"/)
  assert.match(helper, /put\(pathname, buffer/)
  assert.match(helper, /access: "private"/)
  assert.match(helper, /\/objects\/vercel\//)
  assert.match(helper, /get\(vercelBlobPath, \{ access: "private" \}\)/)
  assert.match(helper, /Readable\.fromWeb\(result\.stream as any\)\.pipe\(res\)/)
})


test("imported Replit uploads router is adapted to Vercel Blob at deployment time", () => {
  assert.match(helper, /patchImportedReplitUploadRouter/)
  assert.match(helper, /server\/uploads\.ts/)
  assert.match(helper, /async function uploadToCloudStorage/)
  assert.match(helper, /Vercel Blob upload-router compatibility/)
  assert.match(helper, /objects\/vercel/)
})
