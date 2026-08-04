import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const codegen = fs.readFileSync("lib/786-admin/codegen.ts", "utf8")
const controller = fs.readFileSync("lib/786-chat/provider-controller.ts", "utf8")

test("text and code generation use direct DeepSeek without a Gemini fallback", () => {
  assert.match(codegen, /return deepseek\("deepseek-chat"\)/)
  assert.match(controller, /const candidateModes: CodegenMode\[\] = \[primaryMode\]/)
  assert.doesNotMatch(controller, /\[primaryMode, secondaryMode\]/)
})

test("attachments are analysed by Gemini before DeepSeek generates files", () => {
  assert.match(codegen, /const imageAnalysis = await generateText/)
  assert.match(codegen, /GEMINI IMAGE\/FILE ANALYSIS:/)
  assert.match(codegen, /DeepSeek must generate all project source files/)
  assert.match(codegen, /const picked = pickModel\(generationMode, false\)/)
})

test("direct DeepSeek structured retries never switch to the free Gateway", () => {
  assert.match(codegen, /https:\/\/api\.deepseek\.com\/chat\/completions/)
  assert.match(codegen, /response_format: \{ type: "json_object" \}/)
  assert.match(codegen, /parseDeepSeekProject\(content\)/)
  assert.match(codegen, /The first DeepSeek structured response could not be parsed/)
  assert.match(codegen, /result = await run\(usedModel, true\)/)
  assert.doesNotMatch(codegen, /result = await run\(usedModel, true, retryThroughGateway\)/)
})
