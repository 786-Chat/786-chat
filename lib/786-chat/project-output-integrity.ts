import "server-only"

export const INCOMPLETE_PROJECT_OUTPUT = "AI project output was incomplete and did not contain every planned file."

function extractPlannedFiles(prompt: string) {
  const matches = [...prompt.matchAll(/(?:Planned files|Required system files[^:]*):\s*([^\n]+)/gi)]
  const paths = new Set<string>()
  for (const match of matches) {
    for (const raw of match[1].split(/,\s*/)) {
      const path = raw.trim().replace(/^[-`]+|[-`]+$/g, "")
      if (/^(?:src\/)?(?:app|components|lib|shared|sql|scripts|backend|docs|public|mobile)\//.test(path) || /^(?:package\.json|tsconfig\.json|next\.config\.(?:js|mjs|ts)|postcss\.config\.mjs|tailwind\.config\.(?:js|ts))$/.test(path)) paths.add(path)
    }
  }
  return [...paths]
}

export function assertGeneratedProjectCompleteness(prompt: string, files: Record<string, string>, existing: boolean) {
  // Existing-project edits intentionally return only changed files.
  if (existing) return
  const planned = extractPlannedFiles(prompt)
  if (!planned.length) return
  const missing = planned.filter((path) => !files[path] || !files[path].trim())
  if (missing.length) {
    throw new Error(`${INCOMPLETE_PROJECT_OUTPUT} Missing: ${missing.join(", ")}`)
  }
}
