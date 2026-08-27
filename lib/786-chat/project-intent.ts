const NEGATED_NEW_PROJECT_PATTERNS = [
  /\b(?:do not|don't|never|must not|should not)\s+(?:create|start|make|build|develop)\s+(?:a\s+|an\s+)?new project\b/gi,
  /\bwithout\s+(?:creating|starting|making|building|developing)\s+(?:a\s+|an\s+)?new project\b/gi,
  /\b(?:this|it)\s+is\s+not\s+(?:a\s+|an\s+)?new project\b/gi,
  /\bnot\s+(?:a\s+|an\s+)?new project\b/gi,
  /\bno\s+new project\b/gi,
] as const

function positiveNewProjectText(prompt: string) {
  let message = String(prompt || "")
  for (const pattern of NEGATED_NEW_PROJECT_PATTERNS) {
    message = message.replace(pattern, " ")
  }
  return message.toLowerCase()
}

export function isExplicitNewProjectIntent(prompt: string) {
  const message = positiveNewProjectText(prompt)
  return /\bnew project\b|completely new|this is a new project|\b(?:create|build|develop)\s+(?:a|an)\s+(?:production-ready\s+)?[^\n]{0,140}\b(?:application|app|website|system)\s+called\b/.test(message)
}
