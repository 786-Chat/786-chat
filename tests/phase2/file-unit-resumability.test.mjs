import assert from "node:assert/strict"
import test from "node:test"

const { runFileGenerationUnits } = await import("../../lib/786-chat/file-unit-runner.ts")
const units = ["app/page.tsx", "lib/server/db.ts", "app/api/jobs/route.ts"].map((path, index) => ({ name: `unit-${index + 1}`, files: [path] }))

test("DeepSeek truncates file one and a bounded same-file retry completes it", async () => {
  let deepSeekRequests = 0
  const files = await runFileGenerationUnits({
    units: units.slice(0, 1),
    providers: ["deepseek", "gemini"],
    generate: async (unit, provider) => {
      assert.equal(provider, "deepseek")
      deepSeekRequests++ // simulate the first provider request
      try { throw new Error("DeepSeek JSON response was truncated") }
      catch { deepSeekRequests++; return `complete:${unit.files[0]}` } // compact retry of the same file
    },
  })
  assert.equal(deepSeekRequests, 2)
  assert.deepEqual(files, { "app/page.tsx": "complete:app/page.tsx" })
})

test("later truncation retries only the current file and preserves earlier files", async () => {
  const snapshots = []
  const calls = []
  const files = await runFileGenerationUnits({
    units,
    providers: ["deepseek", "gemini"],
    generate: async (unit, provider, completed) => {
      calls.push(`${provider}:${unit.files[0]}`)
      snapshots.push(Object.keys(completed))
      if (unit.name === "unit-3" && provider === "deepseek") throw new Error("truncated after completed files")
      if (unit.name === "unit-3" && provider === "gemini") throw new Error("model temporarily unavailable")
      return `complete:${unit.files[0]}`
    },
  }).then(() => assert.fail("partial project must not resolve"), (error) => {
    assert.match(error.message, /temporarily unavailable/)
    return null
  })
  assert.equal(files, null)
  assert.deepEqual(calls, [
    "deepseek:app/page.tsx",
    "deepseek:lib/server/db.ts",
    "deepseek:app/api/jobs/route.ts",
    "gemini:app/api/jobs/route.ts",
  ])
  assert.deepEqual(snapshots.at(-1), ["app/page.tsx", "lib/server/db.ts"])
})

test("completed files survive a later compact DeepSeek retry and produce the complete plan", async () => {
  const requests = new Map()
  const files = await runFileGenerationUnits({
    units,
    providers: ["deepseek", "gemini"],
    generate: async (unit, provider, completed) => {
      assert.equal(provider, "deepseek")
      const target = unit.files[0]
      assert.equal(Object.hasOwn(completed, target), false)
      requests.set(target, (requests.get(target) || 0) + 1)
      if (unit.name === "unit-3") {
        try { throw new Error("truncated") }
        catch { requests.set(target, requests.get(target) + 1) }
      }
      return `complete:${target}`
    },
  })
  assert.deepEqual(Object.keys(files), units.map((unit) => unit.files[0]))
  assert.equal(requests.get("app/page.tsx"), 1)
  assert.equal(requests.get("lib/server/db.ts"), 1)
  assert.equal(requests.get("app/api/jobs/route.ts"), 2)
})
