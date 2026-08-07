import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")
}

test("legacy Anthropic provider dependency is removed", () => {
  const pkg = JSON.parse(read("package.json"))
  assert.equal(pkg.dependencies?.["@ai-sdk/anthropic"], undefined)
})

test("provider code uses only DeepSeek and Gemini SDKs", () => {
  const codegen = read("lib/786-admin/codegen.ts")
  const controller = read("lib/786-chat/provider-controller.ts")
  const combined = `${codegen}\n${controller}`
  assert.match(combined, /@ai-sdk\/deepseek/)
  assert.match(combined, /@ai-sdk\/google/)
  assert.doesNotMatch(combined, /@ai-sdk\/anthropic|createAnthropic|claude/i)
})

test("obsolete self-modifying provider patch is retired", () => {
  const pkg = JSON.parse(read("package.json"))
  assert.equal(pkg.scripts?.prebuild, undefined)
  assert.equal(existsSync(new URL("../../scripts/fix-codegen-provider-mode.py", import.meta.url)), false)
  assert.equal(existsSync(new URL("../../.github/workflows/fix-codegen-provider-mode.yml", import.meta.url)), false)
})

test("generator keeps direct DeepSeek and Gemini provider selection", () => {
  const codegen = read("lib/786-admin/codegen.ts")
  assert.match(codegen, /createDeepSeek/)
  assert.match(codegen, /createGoogleGenerativeAI/)
  assert.match(codegen, /mode === "auto" \? "deepseek-flash" : mode/)
})
