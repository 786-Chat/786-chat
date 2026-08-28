export type BuilderMessageIntent = "chat" | "edit"

const DIRECT_EDIT_PATTERNS = [
  /^(?:please\s+)?(?:add|create|build|make|change|update|edit|fix|repair|remove|delete|replace|redesign|implement|apply|move|rename|connect|integrate|deploy|restore|undo|redo|generate)\b/i,
  /\b(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:add|create|build|make|change|update|edit|fix|repair|remove|delete|replace|redesign|implement|apply|move|rename|connect|integrate|deploy|restore|undo|redo|generate)\b/i,
  /\bi\s+(?:need|want|would like)\s+(?:you\s+)?to\s+(?:add|create|build|make|change|update|edit|fix|repair|remove|delete|replace|redesign|implement|apply|move|rename|connect|integrate|deploy|restore|undo|redo|generate)\b/i,
  /\bi\s+(?:need|want)\s+(?:an?\s+)?(?:new\s+)?(?:page|route|component|form|button|sidebar|menu|database|table|api|schema|layout|feature|workflow|dashboard|login|register)\b/i,
] as const

const QUESTION_PATTERNS = [
  /^(?:please\s+)?(?:can|could|would)\s+you\s+(?:help|explain|tell|answer|check|look|review)\b/i,
  /^(?:please\s+)?(?:what|why|how|when|where|which|who|is|are|do|does|did|should|can i|could i|would i)\b/i,
  /\b(?:i need to ask|i want to ask|i have a question|can you help me|could you help me|please help me)\b/i,
  /\?\s*$/,
] as const

export function classifyBuilderMessageIntent(message: string): BuilderMessageIntent {
  const text = String(message || "").trim()
  if (!text) return "edit"

  if (DIRECT_EDIT_PATTERNS.some((pattern) => pattern.test(text))) return "edit"
  if (QUESTION_PATTERNS.some((pattern) => pattern.test(text))) return "chat"

  return "edit"
}

export function isBuilderChatOnlyMessage(message: string) {
  return classifyBuilderMessageIntent(message) === "chat"
}
