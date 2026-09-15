import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = await readFile(new URL("../../lib/786-chat/provider-context.ts", import.meta.url), "utf8")

test("provider context implementation excludes binary-like paths and caps excerpts", () => {
  assert.match(source, /LOW_VALUE_PATH/)
  assert.match(source, /\.slice\(0, MAX_PROVIDER_FILE_CHARS\)/)
  assert.match(source, /remaining = MAX_PROVIDER_CONTEXT_CHARS/)
  assert.match(source, /score \+= 20/)
})
