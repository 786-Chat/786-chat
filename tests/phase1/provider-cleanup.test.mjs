import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")
}

function exists(path) {
  return existsSync(new URL(`../../${path}`, import.meta.url))
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
  assert.equal(exists("scripts/fix-codegen-provider-mode.py"), false)
  assert.equal(exists(".github/workflows/fix-codegen-provider-mode.yml"), false)
})

test("one-off repair workflows cannot mutate unrelated PRs", () => {
  const retired = [
    ".github/workflows/apply-provider-fallback.yml",
    ".github/workflows/fix-login-page-validation.yml",
    ".github/workflows/fix-frontend-only-validation.yml",
    ".github/workflows/fix-negative-backend-requirements.yml",
    ".github/workflows/repair-gemini-json.yml",
    ".github/workflows/repair-provider-timeouts.yml",
    ".github/workflows/restore-fast-provider-failover.yml",
    "scripts/restore-provider-fallback.py",
    "scripts/restore-fast-provider-failover.py",
    "scripts/fix-login-page-validation.py",
    "scripts/fix-negative-backend-requirements.py",
  ]
  for (const path of retired) assert.equal(exists(path), false, `${path} must stay retired`)
})

test("generator keeps direct DeepSeek and Gemini provider selection", () => {
  const codegen = read("lib/786-admin/codegen.ts")
  assert.match(codegen, /createDeepSeek/)
  assert.match(codegen, /createGoogleGenerativeAI/)
  assert.match(codegen, /mode === "auto" \? "deepseek-flash" : mode/)
})
