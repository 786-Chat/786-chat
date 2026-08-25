import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../../", import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), "utf8")
}

test("ordinary existing-project edits may return only changed files even when the prompt contains a full planned-file list", async () => {
  const code = await source("lib/786-chat/project-output-integrity.ts")

  assert.match(code, /const isValidationRepair = \/\\bVALIDATION-GUIDED REPAIR\\b\/i/)
  assert.match(code, /const isFileLevelGeneration = \/\\bFILE-LEVEL FULL-STACK GENERATION\\b\/i/)
  assert.match(code, /if \(existing && !isValidationRepair && !isFileLevelGeneration\) return/)
  assert.match(code, /planner may still include the complete project's Planned files list/)
})

test("validation-guided repair keeps target-file completeness strict but defers local-import resolution to the merged existing project", async () => {
  const code = await source("lib/786-chat/project-output-integrity.ts")

  const bypassAt = code.indexOf("if (existing && !isValidationRepair && !isFileLevelGeneration) return")
  const missingAt = code.indexOf("const missing = planned.filter")
  const importValidationAt = code.indexOf("validatePlannedLocalImports(prompt, files, existing)")

  assert.ok(bypassAt >= 0)
  assert.ok(missingAt > bypassAt)
  assert.ok(importValidationAt > missingAt)
  assert.match(code, /if \(existing && \/\\bVALIDATION-GUIDED REPAIR\\b\/i\.test\(prompt\)\) return/)
  assert.match(code, /merged-project\s+validator and isolated build remain authoritative/)
})
