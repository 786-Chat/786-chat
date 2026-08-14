import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const integrity = await readFile(new URL("../../lib/786-chat/project-output-integrity.ts", import.meta.url), "utf8")

test("batched generation completeness is scoped to the current batch", () => {
  assert.match(integrity, /BATCHED FULL-STACK GENERATION/)
  assert.match(integrity, /Required system files \\(return every file in this batch\\)/)
  assert.match(integrity, /isBatchedGeneration/)
})
