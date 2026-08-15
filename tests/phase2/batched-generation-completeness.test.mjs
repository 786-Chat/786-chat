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

test("file-unit production timeouts are realistic and bounded by the route deadline", () => {
  const number = (name) => Number(controller.match(new RegExp(`const ${name} = ([0-9_]+)`))?.[1].replaceAll("_", ""))
  const deepSeek = number("UNIT_DEEPSEEK_TIMEOUT_MS")
  const gemini = number("UNIT_GEMINI_TIMEOUT_MS")
  const deadline = number("FILE_LEVEL_GENERATION_DEADLINE_MS")
  assert.equal(deepSeek, 75_000)
  assert.equal(gemini, 60_000)
  assert.ok(deepSeek > 30_000)
  assert.ok(gemini > 20_000)
  assert.ok(deepSeek + gemini < deadline)
  assert.equal(deadline, 170_000)
  assert.ok(deadline < 180_000)
  assert.match(controller, /Math\.min\(providerTimeoutMs, remainingMs\)/)
  assert.match(controller, /isFileUnit \? 8_000/)
})
