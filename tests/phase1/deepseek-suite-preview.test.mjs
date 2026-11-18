import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = async (name) => readFile(new URL(`../../${name}`, import.meta.url), "utf8")
const route = await read("app/api/786-chat/deepseek-suite/route.ts")
const page = await read("app/786.chat/deepseek-suite/page.tsx")
const client = await read("components/786-chat/deepseek-suite.tsx")
const projects = await read("app/786.chat/projects/page.tsx")
const api = await read("components/786-chat/api.ts")
const workspace = await read("components/786-chat/workspace.tsx")
const intent = await read("lib/786-chat/message-intent.ts")

test("DeepSeek Suite is admin-only, locked by default and never writes projects", () => {
  assert.match(route, /isAdminUser\(session\?\.email\)/)
  assert.match(page, /isAdminUser\(session\.email\)/)
  assert.match(route, /process\.env\.DEEPSEEK_SUITE_ENABLED === "true"/)
  assert.match(route, /if \(!enabled\(\)\) return jsonError/)
  assert.match(route, /body\.confirm !== true/)
  assert.match(route, /form\.get\("confirm"\) !== "yes"/)
  assert.doesNotMatch(route, /saveBuilderProject|queueBuilderBuild|deployBuilderProject|deleteBuilderProject/)
})

test("All basic DeepSeek tools have independent guarded routes", () => {
  for (const path of [
    "/chat/completions", "/v1/tools/search", "/v1/tools/fetch",
    "/v1/tools/tts", "/v1/tools/asr", "/v1/tools/ocr", "/files",
  ]) assert.ok(route.includes(path), `missing provider endpoint ${path}`)
  assert.match(route, /"document-chat"/)
  assert.match(route, /validFileId\(fileId\)/)
  assert.match(route, /publicWebUrl\(url\)/)
  assert.match(route, /MAX_FILE_BYTES/)
  assert.match(route, /file\.size > 8 \* 1024 \* 1024/)
})

test("Owner navigation exposes tools without changing project generator", () => {
  assert.match(projects, /href="\/786\.chat\/deepseek-suite"/)
  assert.match(client, /I approve this single potentially chargeable API request/)
  assert.match(client, /disabled=\{!confirmed \|\| !enabled \|\| busy\}/)
  assert.doesNotMatch(client, /DEEPSEEK_API_KEY/)
})

test("Ordinary questions cannot create blank project or queue a build", () => {
  assert.match(intent, /return "chat"\s*\}/)
  assert.match(api, /if \(isBuilderChatOnlyMessage\(request\.message\)\)/)
  assert.match(api, /fetch\("\/api\/786-chat\/ask"/)
  assert.match(workspace, /if \(!project && String\(generated\.model \|\| ""\)\.startsWith\("chat-only:"\)\)/)
})
