import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import ts from "typescript"

const sourceUrl = new URL("../../lib/786-chat/file-unit-runner.ts", import.meta.url)
const source = await readFile(sourceUrl, "utf8")
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: "file-unit-runner.ts",
}).outputText
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`
const { runFileGenerationUnits } = await import(moduleUrl)

const unit = { name: "application-shell-and-primary-pages-42", files: ["app/purchases/[id]/page.tsx"] }

test("retries the same provider once when a planned target file is missing", async () => {
  const calls = []
  const files = await runFileGenerationUnits({
    units: [unit],
    providers: ["deepseek", "gemini"],
    generate: async (_unit, provider) => {
      calls.push(provider)
      if (provider === "deepseek" && calls.length === 1) {
        throw new Error("AI project output was incomplete and did not contain every planned file. Missing: app/purchases/[id]/page.tsx")
      }
      if (provider === "gemini") assert.fail("Gemini fallback should not be used after DeepSeek self-repair succeeds")
      return "export default function PurchasePage() { return null }"
    },
  })

  assert.deepEqual(calls, ["deepseek", "deepseek"])
  assert.match(files["app/purchases/[id]/page.tsx"], /PurchasePage/)
})

test("retries the same provider once when a generated local import is outside the plan", async () => {
  const calls = []
  const files = await runFileGenerationUnits({
    units: [unit],
    providers: ["deepseek", "gemini"],
    generate: async (_unit, provider) => {
      calls.push(provider)
      if (provider === "deepseek" && calls.length === 1) {
        throw new Error("AI generated an import for a local file that is not part of the project plan. app/purchases/[id]/page.tsx imports @/components/ui/badge, but no matching planned file exists.")
      }
      if (provider === "gemini") assert.fail("Gemini fallback should not be used after DeepSeek self-repair succeeds")
      return "export default function PurchasePage() { return null }"
    },
  })

  assert.deepEqual(calls, ["deepseek", "deepseek"])
  assert.match(files["app/purchases/[id]/page.tsx"], /PurchasePage/)
})

test("does not retry the same provider for quota or timeout failures", async () => {
  const calls = []
  const files = await runFileGenerationUnits({
    units: [unit],
    providers: ["deepseek", "gemini"],
    generate: async (_unit, provider) => {
      calls.push(provider)
      if (provider === "deepseek") throw new Error("provider timed out after 60000ms")
      return "export default function PurchasePage() { return null }"
    },
  })

  assert.deepEqual(calls, ["deepseek", "gemini"])
  assert.match(files["app/purchases/[id]/page.tsx"], /PurchasePage/)
})

test("falls back after one bounded structural retry if the same provider still fails", async () => {
  const calls = []
  const files = await runFileGenerationUnits({
    units: [unit],
    providers: ["deepseek", "gemini"],
    generate: async (_unit, provider) => {
      calls.push(provider)
      if (provider === "deepseek") {
        throw new Error("AI project output was incomplete and did not contain every planned file. Missing: app/purchases/[id]/page.tsx")
      }
      return "export default function PurchasePage() { return null }"
    },
  })

  assert.deepEqual(calls, ["deepseek", "deepseek", "gemini"])
  assert.match(files["app/purchases/[id]/page.tsx"], /PurchasePage/)
})
