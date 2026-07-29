import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const workspace = await readFile("components/786-chat/workspace.tsx", "utf8")
const api = await readFile("components/786-chat/api.ts", "utf8")

test("canonical preview never restores or renders srcdoc", () => {
  assert.doesNotMatch(workspace, /srcDoc|restoreProjectPreview|about:blank/)
  assert.match(workspace, /build\?\.status === "passed" && build\.deployment_url/)
})

test("canonical preview polls the isolated build endpoint", () => {
  assert.match(api, /\/api\/786-chat\/projects\/\$\{projectId\}\/build/)
  assert.match(workspace, /loadBuilderBuild/)
  assert.match(workspace, /queueBuilderBuild/)
})
