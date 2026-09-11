import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const finalizer = await readFile(
  new URL("../../lib/786-admin/imported-runtime-finalizer.ts", import.meta.url),
  "utf8",
)

test("imported remote image URLs are converted from ESM imports into string asset constants", () => {
  assert.match(finalizer, /REMOTE_BINARY_ASSET_IMPORT/)
  assert.match(finalizer, /jpe\?g\|png\|svg\|webp/)
  assert.match(finalizer, /rewriteRemoteBinaryAssetModuleImports\(runtimeFiles\)/)
  assert.match(finalizer, /786\.Chat: imported binary asset URL/)
})

test("remote asset repair runs before imported client files are bundled", () => {
  const repairIndex = finalizer.indexOf("rewriteRemoteBinaryAssetModuleImports(runtimeFiles)")
  const viteIndex = finalizer.indexOf("lazyLoadViteInProductionRuntime(runtimeFiles)")
  assert.ok(repairIndex >= 0)
  assert.ok(viteIndex > repairIndex)
})
