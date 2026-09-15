import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const context = await readFile(new URL("../../lib/786-chat/provider-context.ts", import.meta.url), "utf8")
const codegen = await readFile(new URL("../../lib/786-admin/codegen.ts", import.meta.url), "utf8")

test("existing project provider context has a strict input budget", () => {
  assert.match(context, /MAX_PROVIDER_CONTEXT_FILES = 10/)
  assert.match(context, /MAX_PROVIDER_CONTEXT_CHARS = 48_000/)
  assert.match(context, /MAX_PROVIDER_FILE_CHARS = 8_000/)
  assert.match(context, /data-url omitted/)
  assert.match(context, /large encoded payload omitted/)
})

test("codegen sends bounded relevant files instead of every saved file", () => {
  assert.match(codegen, /boundedExistingProjectContext/)
  assert.match(codegen, /RELEVANT EXISTING FILE CONTENTS \(BOUNDED\)/)
  assert.doesNotMatch(codegen, /Object\.entries\(input\.existing\.keyFiles\)\.map/)
})
