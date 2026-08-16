import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const deterministic = await readFile(new URL("../../lib/786-chat/deterministic-build-repair.ts", import.meta.url), "utf8")
const workflow = await readFile(new URL("../../.github/workflows/generated-project-build.yml", import.meta.url), "utf8")

test("Neon tagged-query typing repair participates in the deterministic multi-repair pass", () => {
  assert.match(deterministic, /function repairNeonTaggedQueryRows/)
  assert.match(deterministic, /FullQueryResults/)
  assert.match(deterministic, /Array<Record<string, any>>/)
  assert.match(deterministic, /const neonRows = repairNeonTaggedQueryRows\(\{ \.\.\.files, \.\.\.repairedFiles \}, logs\)/)
  assert.match(deterministic, /models\.push\("neon-query-result-array"\)/)

  const tailwindIndex = deterministic.indexOf("repairTailwindSemanticTheme")
  const neonIndex = deterministic.lastIndexOf("repairNeonTaggedQueryRows")
  assert.ok(tailwindIndex >= 0 && neonIndex > tailwindIndex, "multi-repair should keep existing deterministic repairs and add Neon typing")
})

test("generated build callback reports an actionable compiler error", () => {
  assert.match(workflow, /const actionable = lines\.find/)
  assert.match(workflow, /error TS\\d\+:/)
  assert.match(workflow, /Type error:/)
  assert.match(workflow, /errorMessage,/)
  assert.doesNotMatch(workflow, /ERROR_MESSAGE:.*One or more isolated build commands failed/)
})
