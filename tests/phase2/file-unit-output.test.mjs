import assert from "node:assert/strict"
import test from "node:test"

const { fileUnitTargetFromPrompt, parseFileUnitOutput } = await import("../../lib/786-chat/file-unit-output.ts")
const target = "app/api/jobs/route.ts"
const prompt = `FILE-LEVEL FULL-STACK GENERATION 3/10\nRequired system files (return every file in this unit): ${target}`

test("file-unit prompt extracts the exact requested path", () => {
  assert.equal(fileUnitTargetFromPrompt(prompt), target)
  assert.equal(fileUnitTargetFromPrompt("ordinary project"), null)
})

test("tiny path/content JSON is accepted without a project envelope", () => {
  assert.deepEqual(parseFileUnitOutput(JSON.stringify({ path: target, content: "export function GET() {}" }), target), {
    path: target,
    content: "export function GET() {}",
  })
})

test("wrong path and empty content are rejected", () => {
  assert.throws(() => parseFileUnitOutput(JSON.stringify({ path: "app/page.tsx", content: "valid" }), target), /wrong path/)
  assert.throws(() => parseFileUnitOutput(JSON.stringify({ path: target, content: "  " }), target), /could not be parsed or validated/)
})

test("truncated, fenced and project-envelope JSON are rejected", () => {
  assert.throws(() => parseFileUnitOutput(`{"path":"${target}","content":"partial`, target), /could not be parsed or validated/)
  assert.throws(() => parseFileUnitOutput(`\`\`\`json\n${JSON.stringify({ path: target, content: "valid" })}\n\`\`\``, target), /could not be parsed or validated/)
  assert.throws(() => parseFileUnitOutput(JSON.stringify({ title: "Project", files: [{ path: target, content: "valid" }] }), target), /could not be parsed or validated/)
})
