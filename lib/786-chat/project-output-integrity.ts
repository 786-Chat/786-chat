import "server-only"
import path from "node:path"

export const INCOMPLETE_PROJECT_OUTPUT = "AI project output was incomplete and did not contain every planned file."
export const INVALID_PROJECT_IMPORT = "AI generated an import for a local file that is not part of the project plan."

function cleanPath(value: string) {
  return value.trim().replace(/^[-`]+|[-`]+$/g, "")
}

function extractPathList(prompt: string, label: RegExp) {
  const paths = new Set<string>()
  for (const match of prompt.matchAll(label)) {
    for (const raw of match[1].split(/,\s*/)) {
      const file = cleanPath(raw)
      if (/^(?:src\/)?(?:app|components|lib|shared|sql|scripts|backend|docs|public|mobile)\//.test(file) || /^(?:package\.json|tsconfig\.json|next\.config\.(?:js|mjs|ts)|postcss\.config\.mjs|tailwind\.config\.(?:js|ts))$/.test(file)) paths.add(file)
    }
  }
  return paths
}

function extractRequiredFiles(prompt: string) {
  const isFileLevelGeneration = /\bFILE-LEVEL FULL-STACK GENERATION\b/i.test(prompt)
  if (isFileLevelGeneration) {
    const paths = extractPathList(prompt, /Required system files \(return every file in this unit\):\s*([^\n]+)/gi)
    for (const match of prompt.matchAll(/Target file:\s*([^\n]+)/gi)) {
      const file = cleanPath(match[1])
      if (file) paths.add(file)
    }
    return [...paths]
  }
  return [...extractPathList(prompt, /(?:Planned files|Required system files[^:]*):\s*([^\n]+)/gi)]
}

function extractPlannedAllowlist(prompt: string) {
  const allowlist = extractPathList(prompt, /Complete planned file allowlist:\s*([^\n]+)/gi)
  if (allowlist.size) return allowlist
  return extractPathList(prompt, /Planned files:\s*([^\n]+)/gi)
}

function importSpecifiers(content: string) {
  const values = new Set<string>()
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ]
  for (const pattern of patterns) for (const match of content.matchAll(pattern)) values.add(match[1])
  return [...values]
}

function localImportBase(sourcePath: string, specifier: string) {
  if (specifier.startsWith("@/")) return specifier.slice(2)
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), specifier))
  }
  return null
}

function candidates(base: string) {
  if (/\.[a-z0-9]+$/i.test(base)) return [base]
  return [
    base,
    `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}.cjs`, `${base}.css`,
    `${base}/index.ts`, `${base}/index.tsx`, `${base}/index.js`, `${base}/index.jsx`,
  ]
}

function validatePlannedLocalImports(prompt: string, files: Record<string, string>) {
  if (!/\bFILE-LEVEL FULL-STACK GENERATION\b/i.test(prompt)) return
  const planned = extractPlannedAllowlist(prompt)
  if (!planned.size) return

  for (const [sourcePath, content] of Object.entries(files)) {
    if (!/\.(?:tsx?|jsx?|mjs|cjs)$/.test(sourcePath)) continue
    for (const specifier of importSpecifiers(content)) {
      const base = localImportBase(sourcePath, specifier)
      if (!base) continue
      if (candidates(base).some((candidate) => planned.has(candidate) || Boolean(files[candidate]))) continue
      throw new Error(`${INVALID_PROJECT_IMPORT} ${sourcePath} imports ${specifier}, but no matching planned file exists.`)
    }
  }
}

export function assertGeneratedProjectCompleteness(prompt: string, files: Record<string, string>, existing: boolean) {
  const planned = extractRequiredFiles(prompt)
  const isValidationRepair = /\bVALIDATION-GUIDED REPAIR\b/i.test(prompt)
  const isFileLevelGeneration = /\bFILE-LEVEL FULL-STACK GENERATION\b/i.test(prompt)
  // Ordinary existing-project edits intentionally return only new/changed files.
  // The planner may still include the complete project's Planned files list in
  // the provider prompt, so that list must not turn a targeted edit into a full
  // regeneration requirement. Validation-guided repairs and explicit file-level
  // generation units remain strict because they name the files that must return.
  if (existing && !isValidationRepair && !isFileLevelGeneration) return
  if (!planned.length) return
  const missing = planned.filter((file) => !files[file] || !files[file].trim())
  if (missing.length) throw new Error(`${INCOMPLETE_PROJECT_OUTPUT} Missing: ${missing.join(", ")}`)
  validatePlannedLocalImports(prompt, files)
}
