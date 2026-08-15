import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const integrity = await readFile(new URL("../../lib/786-chat/project-output-integrity.ts", import.meta.url), "utf8")
const controller = await readFile(new URL("../../lib/786-chat/provider-controller.ts", import.meta.url), "utf8")
const codegen = await readFile(new URL("../../lib/786-admin/codegen.ts", import.meta.url), "utf8")

test("file-level generation completeness is scoped to the current unit", () => {
  assert.match(integrity, /FILE-LEVEL/)
  assert.match(integrity, /return every file in this \(\?:batch\|unit\)/)
  assert.match(integrity, /isBatchedGeneration/)
})

test("long full-stack generation retains completed files and never truncates the file plan", () => {
  assert.match(controller, /files: \[file\]/)
  assert.match(controller, /runFileGenerationUnits\(/)
  assert.match(controller, /dependencyContext\(completedFiles as Record<string, string>, unit\.files\[0\]\)/)
  assert.doesNotMatch(controller, /MAX_GENERATION_BATCHES|MAX_FILES_PER_BATCH|batches\.slice/)
  assert.match(controller, /\["deepseek-flash","gemini-flash"\]/)
})

test("a truncated individual file is compacted and retried without accepting partial JSON", () => {
  assert.match(codegen, /ONE FILE RETRY/)
  assert.match(codegen, /FILE_UNIT_RETRY_MAX_TOKENS = 8_000/)
  assert.match(codegen, /extractProjectJson\(text, !\/\\bFILE-LEVEL/)
  assert.match(codegen, /JSON response \(\?:could not be parsed\|was truncated\)/)
  assert.match(codegen, /Never return a prefix, continuation, patch, or partial file/)
  assert.match(controller, /Provider error:/)
})
