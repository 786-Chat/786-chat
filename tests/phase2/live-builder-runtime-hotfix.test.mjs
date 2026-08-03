import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("production build callbacks accept both public aliases and use the canonical origin", async () => {
  const runner = await read("lib/786-admin/build-runner.ts")

  assert.match(runner, /url\.hostname === "786\.chat" \|\| url\.hostname === "www\.786\.chat"/)
  assert.match(runner, /return isProduction \? "https:\/\/786\.chat" : url\.origin/)
  assert.match(runner, /url\.hostname\.endsWith\("\.vercel\.app"\)/)
})

test("unparseable direct DeepSeek output retries through the configured AI Gateway", async () => {
  const codegen = await read("lib/786-admin/codegen.ts")

  assert.match(codegen, /function gatewayConfigured\(\)/)
  assert.match(codegen, /retryThroughGateway/)
  assert.match(codegen, /result = await run\(usedModel, true, retryThroughGateway\)/)
  assert.match(codegen, /retried through the Vercel AI Gateway with stricter output rules/)
})
