import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const intent = await readFile(
  new URL("../../lib/786-chat/project-intent.ts", import.meta.url),
  "utf8",
)
const generateRoute = await readFile(
  new URL("../../app/api/786-chat/generate/route.ts", import.meta.url),
  "utf8",
)
const provider = await readFile(
  new URL("../../lib/786-chat/provider-controller.ts", import.meta.url),
  "utf8",
)

test("negative new-project wording is stripped before intent detection", () => {
  assert.match(intent, /do not\|don't\|never\|must not\|should not/)
  assert.match(intent, /not\\s\+\(\?:a\\s\+\|an\\s\+\)\?new project/)
  assert.match(intent, /positiveNewProjectText/)
})

test("generate route preserves projectId and existing context for negative new-project instructions", () => {
  assert.match(generateRoute, /isExplicitNewProjectIntent\(prompt\)/)
  assert.doesNotMatch(generateRoute, /function isExplicitNewApplicationPrompt/)
})

test("provider uses the same new-project intent guard", () => {
  assert.match(provider, /isExplicitNewProjectIntent\(requestText\(payload\)\)/)
  assert.doesNotMatch(provider, /const message = requestText\(payload\); return \/\\bnew project/)
})

test("auto mode uses DeepSeek Flash first with Gemini Flash fallback", () => {
  assert.match(provider, /else candidateModes = \["deepseek-flash", "gemini-flash"\]/)
})

test("file-level failure reports an existing project as preserved", () => {
  assert.match(provider, /error: compactFailure\(attempts, isExistingEdit\)/)
  assert.match(provider, /projectPreserved: isExistingEdit/)
})
