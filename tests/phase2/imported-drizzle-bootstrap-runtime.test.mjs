import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const finalizer = await readFile(
  new URL("../../lib/786-admin/imported-runtime-finalizer.ts", import.meta.url),
  "utf8",
)

test("imported Drizzle apps only bootstrap an empty generated database", () => {
  assert.match(finalizer, /ensureImportedDrizzleSchemaBootstrap/)
  assert.match(finalizer, /drizzle\.config\.ts/)
  assert.match(finalizer, /shared\/schema\.ts/)
  assert.match(finalizer, /@neondatabase\/serverless/)
  assert.match(finalizer, /information_schema\.tables/)
  assert.match(finalizer, /if \(count > 0\)/)
  assert.match(finalizer, /drizzle-kit/)
  assert.match(finalizer, /push/)
  assert.match(finalizer, /--force/)
  assert.match(finalizer, /node scripts\/786-drizzle-bootstrap\.mjs/)
})
