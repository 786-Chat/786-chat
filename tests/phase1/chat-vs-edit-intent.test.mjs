import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const intent = await readFile(
  new URL("../../lib/786-chat/message-intent.ts", import.meta.url),
  "utf8",
)
const api = await readFile(
  new URL("../../components/786-chat/api.ts", import.meta.url),
  "utf8",
)
const askRoute = await readFile(
  new URL("../../app/api/786-chat/ask/route.ts", import.meta.url),
  "utf8",
)
const messagesRoute = await readFile(
  new URL("../../app/api/786-chat/projects/[id]/messages/route.ts", import.meta.url),
  "utf8",
)

test("plain help and question wording is classified as chat-only", () => {
  assert.match(intent, /i need to ask/)
  assert.match(intent, /can you help me/)
  assert.match(intent, /QUESTION_PATTERNS/)
})

test("direct project mutation language remains edit intent", () => {
  assert.match(intent, /DIRECT_EDIT_PATTERNS/)
  assert.match(intent, /add\|create\|build\|make\|change\|update\|edit\|fix\|repair/)
  assert.match(intent, /can\|could\|would\|will/)
})

test("builder sends chat-only questions to ask endpoint instead of generator", () => {
  assert.match(api, /isBuilderChatOnlyMessage\(request\.message\)/)
  assert.match(api, /fetch\("\/api\/786-chat\/ask"/)
  assert.match(api, /model: `chat-only:/)
})

test("chat-only answers persist messages without saving files or revisions", () => {
  assert.match(api, /projects\/\$\{input\.currentProjectId\}\/messages/)
  assert.match(messagesRoute, /appendMessage/)
  assert.doesNotMatch(messagesRoute, /saveGeneratedProjectAtomic|createProjectRevision|upsertFiles/)
})

test("chat-only answer skips the next build dispatch", () => {
  assert.match(api, /skipNextBuildProjectIds\.add/)
  assert.match(api, /skipNextBuildProjectIds\.delete/)
  assert.match(api, /return loadBuilderBuild\(projectId\)/)
})

test("chat-only endpoint explicitly forbids claiming project changes", () => {
  assert.match(askRoute, /MUST NOT claim that you created, changed, fixed, added, removed, deployed or rebuilt anything/)
})
