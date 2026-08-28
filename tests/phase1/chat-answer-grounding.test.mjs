import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const askRoute = await readFile(
  new URL("../../app/api/786-chat/ask/route.ts", import.meta.url),
  "utf8",
)
const context = await readFile(
  new URL("../../lib/786-chat/chat-context.ts", import.meta.url),
  "utf8",
)

test("chat-only questions use project source context instead of route names alone", () => {
  assert.match(askRoute, /projectQuestionContext/)
  assert.match(askRoute, /Relevant project source excerpts/)
  assert.match(askRoute, /Do not invent project facts/)
  assert.match(askRoute, /cannot verify it from the available project context/)
})

test("project chat context ranks relevant files and limits prompt size", () => {
  assert.match(context, /MAX_CONTEXT_FILES = 6/)
  assert.match(context, /MAX_CONTEXT_CHARS = 18_000/)
  assert.match(context, /fileScore/)
  assert.match(context, /selectedPaths/)
})

test("chat-only answers keep recent conversation for follow-up questions", () => {
  assert.match(context, /MAX_RECENT_MESSAGES = 8/)
  assert.match(context, /recentProjectConversation/)
  assert.match(askRoute, /messages: project\.messages \|\| \[\]/)
})
