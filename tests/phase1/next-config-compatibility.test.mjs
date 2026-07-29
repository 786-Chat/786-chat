import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("new project plans and generator contract use portable Next config", async () => {
  const [planner, codegen] = await Promise.all([
    read("lib/786-chat/planner.ts"),
    read("lib/786-admin/codegen.ts"),
  ])

  assert.match(planner, /next\.config\.mjs/)
  assert.doesNotMatch(planner, /next\.config\.ts/)
  assert.match(codegen, /Never create next\.config\.ts/)
})

test("isolated build validation rejects unsupported next.config.ts", async () => {
  const validation = await read("lib/786-admin/build-validation.ts")

  assert.match(validation, /UNSUPPORTED_NEXT_CONFIG_TS/)
  assert.match(validation, /next\.config\.mjs or next\.config\.js/)
})
