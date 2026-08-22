import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const runnerPath = new URL("../../lib/786-chat/file-unit-runner.ts", import.meta.url)

test("validation repair can retain an existing saved file when regeneration fails", async () => {
  const source = await readFile(runnerPath, "utf8")

  assert.match(source, /canRetainExistingValidationRepair/)
  assert.match(source, /unit\.name\.startsWith\("validation-repair-"\)/)
  assert.match(source, /completedFiles\[target\]\?\.trim\(\)/)
  assert.match(source, /let the final project validator/)
  assert.match(source, /completed = true/)
})
