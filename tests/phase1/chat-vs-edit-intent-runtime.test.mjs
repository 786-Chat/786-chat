import assert from "node:assert/strict"
import test from "node:test"

const directEditPatterns = [
  /^(?:please\s+)?(?:add|create|build|make|change|update|edit|fix|repair|remove|delete|replace|redesign|implement|apply|move|rename|connect|integrate|deploy|restore|undo|redo|generate)\b/i,
  /\b(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:add|create|build|make|change|update|edit|fix|repair|remove|delete|replace|redesign|implement|apply|move|rename|connect|integrate|deploy|restore|undo|redo|generate)\b/i,
  /\bi\s+(?:need|want|would like)\s+(?:you\s+)?to\s+(?:add|create|build|make|change|update|edit|fix|repair|remove|delete|replace|redesign|implement|apply|move|rename|connect|integrate|deploy|restore|undo|redo|generate)\b/i,
  /\bi\s+(?:need|want)\s+(?:an?\s+)?(?:new\s+)?(?:page|route|component|form|button|sidebar|menu|database|table|api|schema|layout|feature|workflow|dashboard|login|register)\b/i,
]
const questionPatterns = [
  /^(?:please\s+)?(?:can|could|would)\s+you\s+(?:help|explain|tell|answer|check|look|review)\b/i,
  /^(?:please\s+)?(?:what|why|how|when|where|which|who|is|are|do|does|did|should|can i|could i|would i)\b/i,
  /\b(?:i need to ask|i want to ask|i have a question|can you help me|could you help me|please help me)\b/i,
  /\?\s*$/,
]
function classify(message) {
  const text = message.trim()
  if (directEditPatterns.some((pattern) => pattern.test(text))) return "edit"
  if (questionPatterns.some((pattern) => pattern.test(text))) return "chat"
  return "edit"
}

test("exact reported help request is chat-only", () => {
  assert.equal(classify("i need to ask question please can you help me"), "chat")
})

test("questions stay read-only", () => {
  assert.equal(classify("Why did my build fail?"), "chat")
  assert.equal(classify("What does Ready Stock mean?"), "chat")
  assert.equal(classify("Can you explain the Production flow?"), "chat")
})

test("explicit edit requests still edit", () => {
  assert.equal(classify("Fix the build error"), "edit")
  assert.equal(classify("Can you update the sidebar?"), "edit")
  assert.equal(classify("Please add a support page"), "edit")
  assert.equal(classify("I want you to change Process Flow"), "edit")
})
