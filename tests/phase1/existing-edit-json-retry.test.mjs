import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const codegenPath = new URL("../../lib/786-admin/codegen.ts", import.meta.url)

test("existing project JSON failures receive a compact DeepSeek retry", async () => {
  const source = await readFile(codegenPath, "utf8")
  assert.match(source, /EXISTING PROJECT RETRY:/)
  assert.match(source, /if \(!retryable\) throw error/)
  assert.doesNotMatch(source, /input\.existing && !fileLevelUnit/)
  assert.match(source, /compactRetryPrompt\(prompt, Boolean\(input\.existing\)\)/)
})
