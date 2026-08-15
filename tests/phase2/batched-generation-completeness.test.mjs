import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const integrity = await readFile(new URL("../../lib/786-chat/project-output-integrity.ts", import.meta.url), "utf8")
const controller = await readFile(new URL("../../lib/786-chat/provider-controller.ts", import.meta.url), "utf8")

test("file-level generation completeness is scoped to the current unit", () => {
  assert.match(integrity, /FILE-LEVEL/)
  assert.match(integrity, /return every file in this \(\?:batch\|unit\)/)
  assert.match(integrity, /isBatchedGeneration/)
})

test("long full-stack generation retains completed files and never truncates the file plan", () => {
  assert.match(controller, /files: \[file\]/)
  assert.match(controller, /files = \{ \.\.\.files, \[target\]: generated\.files\[target\] \}/)
  assert.match(controller, /dependencyContext\(files, unit\.files\[0\]\)/)
  assert.doesNotMatch(controller, /MAX_GENERATION_BATCHES|MAX_FILES_PER_BATCH|batches\.slice/)
  assert.match(controller, /\["deepseek-flash","gemini-flash"\]/)
})
