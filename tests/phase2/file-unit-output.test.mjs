import assert from "node:assert/strict"
import test from "node:test"

const { parseFileUnitOutput, requestedFilePathFromPrompt } = await import("../../lib/786-chat/file-unit-output.ts")

const prompt = `FILE-LEVEL FULL-STACK GENERATION 1/10: foundation-config-auth-database-1\nRequired system files (return every file in this unit): package.json\nGenerate ONLY the single file listed for this unit.`

test("extracts the exact requested file target", () => {
  assert.equal(requestedFilePathFromPrompt(prompt), "package.json")
})

test("accepts only strict path/content JSON", () => {
  assert.deepEqual(parseFileUnitOutput('{"path":"package.json","content":"{\\"scripts\\":{}}"}', "package.json"), {
    path: "package.json",
    content: '{"scripts":{}}',
  })
})

test("rejects wrong file path", () => {
  assert.throws(() => parseFileUnitOutput('{"path":"app/page.tsx","content":"export default function Page(){}"}', "package.json"), /path mismatch/i)
})

test("rejects empty content", () => {
  assert.throws(() => parseFileUnitOutput('{"path":"package.json","content":"   "}', "package.json"), /content was empty/i)
})

test("rejects truncated JSON", () => {
  assert.throws(() => parseFileUnitOutput('{"path":"package.json","content":"abc"', "package.json"), /could not be parsed or validated/i)
})

test("rejects markdown fenced JSON", () => {
  assert.throws(() => parseFileUnitOutput('```json\n{"path":"package.json","content":"abc"}\n```', "package.json"), /could not be parsed or validated/i)
})

test("rejects the old project envelope for file units", () => {
  assert.throws(() => parseFileUnitOutput('{"title":"Bean House","description":"x","reply":"x","files":[{"path":"package.json","content":"abc"}]}', "package.json"), /could not be parsed or validated/i)
})
