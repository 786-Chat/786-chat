import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { parseProviderJson, normalizeExistingProjectJson } from "../../lib/786-chat/provider-json-recovery.js"

const existing = { title: "Existing Pest Control", description: "Keep customer records" }

test("valid structured project JSON is unchanged", () => {
  const project = { title: "T", description: "D", reply: "Done", files: [{ path: "app/page.tsx", content: "export default function Page() { return null }" }] }
  assert.deepEqual(parseProviderJson(JSON.stringify(project)), project)
})

test("a full JSON fence is accepted without accepting surrounding prose", () => {
  const text = '```json\n{"path":"app/page.tsx","content":"export default null"}\n```'
  assert.deepEqual(parseProviderJson(text), { path: "app/page.tsx", content: "export default null" })
  assert.throws(() => parseProviderJson("Explanation first. " + text))
})

test("unescaped code newlines within a JSON string are safely escaped", () => {
  const source = '{"path":"app/page.tsx","content":"const a = 1;\nconst b = 2;\t// ok"}'
  assert.deepEqual(parseProviderJson(source), {
    path: "app/page.tsx",
    content: "const a = 1;\nconst b = 2;\t// ok",
  })
})

test("valid escaped backslashes and quotes retain exact source bytes", () => {
  const project = { path: "app/page.tsx", content: String.raw`const p = "C:\\src"; const title = "\"hello\"";` }
  assert.deepEqual(parseProviderJson(JSON.stringify(project)), project)
})

test("existing edits may use a complete map of changed source files with inherited metadata", () => {
  const result = normalizeExistingProjectJson({
    project: { files: { "app/page.tsx": "export default function Page() { return null }" } },
  }, existing)
  assert.equal(result.title, existing.title)
  assert.equal(result.description, existing.description)
  assert.equal(result.reply, "Existing project updated.")
  assert.deepEqual(result.files, [{ path: "app/page.tsx", content: "export default function Page() { return null }" }])
})

test("new projects do not acquire invented metadata or missing code", () => {
  const response = { files: { "app/page.tsx": "some code" } }
  assert.equal(normalizeExistingProjectJson(response, undefined), response)
  assert.equal(normalizeExistingProjectJson({ files: [] }, existing).files.length, 0)
})

test("truncated or malformed code is never synthesized", () => {
  assert.throws(() => parseProviderJson('{"files":[{"path":"app/page.tsx","content":"unfinished'))
  assert.throws(() => parseProviderJson("not json"))
})

test("the production generator and file-unit validator share conservative recovery", async () => {
  const generator = await readFile("lib/786-admin/codegen.ts", "utf8")
  const unit = await readFile("lib/786-chat/file-unit-output.ts", "utf8")
  assert.match(generator, /normalizeExistingProjectJson\(parseProviderJson/)
  assert.match(generator, /ProjectSchema\.safeParse/)
  assert.match(generator, /DeepSeek API/)
  assert.match(unit, /parseProviderJson\(text\)/)
  assert.match(unit, /FileUnitSchema\.safeParse/)
  assert.match(unit, /parsed\.data\.path !== expectedPath/)
})
