import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const provider = await readFile(new URL("../../lib/786-chat/provider-controller.ts", import.meta.url), "utf8")

test("validation-guided repair can finish several small missing route files in one request", () => {
  assert.match(provider, /MAX_FILE_UNITS_PER_REQUEST\s*=\s*2/)
  assert.match(provider, /MAX_VALIDATION_REPAIR_FILE_UNITS_PER_REQUEST\s*=\s*4/)
  assert.match(provider, /VALIDATION-GUIDED REPAIR/)
  assert.match(provider, /const unitLimit = .*MAX_VALIDATION_REPAIR_FILE_UNITS_PER_REQUEST.*MAX_FILE_UNITS_PER_REQUEST/)
  assert.match(provider, /units\.slice\(startIndex, startIndex \+ unitLimit\)/)
})
