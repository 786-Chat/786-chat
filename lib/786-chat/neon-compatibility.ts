import { normalizeGeneratedResendUsage } from "./resend-compatibility"

export function normalizeGeneratedNeonServerlessUsage(files: Record<string, string>) {
  const dbPath = files["lib/server/db.ts"]
    ? "lib/server/db.ts"
    : files["src/lib/server/db.ts"]
      ? "src/lib/server/db.ts"
      : null

  let normalizedFiles = files

  if (dbPath) {
    const dbSource = files[dbPath]
    if (/@neondatabase\/serverless/.test(dbSource) && /\bneon\s*\(/.test(dbSource)) {
      normalizedFiles = Object.fromEntries(Object.entries(files).map(([path, content]) => {
        if (!/\.(?:ts|tsx|js|jsx)$/.test(path) || (!/\.query\s*\(/.test(content) && !/\.rows\b/.test(content) && !/\.rowCount\b/.test(content))) {
          return [path, content]
        }

        const neonVariables = new Set<string>()
        for (const match of content.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?get(?:Sql|Db)\s*\(\s*\)/g)) {
          neonVariables.add(match[1])
        }
        for (const match of content.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*neon\s*\(/g)) {
          neonVariables.add(match[1])
        }

        let normalized = content
          .replace(/\b(get(?:Sql|Db)\s*\(\s*\))\.query\s*\(/g, "$1(")

        for (const variable of neonVariables) {
          normalized = normalized.replace(
            new RegExp(`\\b${variable}\\.query\\s*\\(`, "g"),
            `${variable}(`,
          )
        }

        // @neondatabase/serverless `neon()` query functions return row arrays directly.
        // Generated code can incorrectly use the node-postgres result shape (`result.rows`
        // or `result.rowCount`). Track only values visibly assigned from our Neon query
        // helpers so unrelated objects with legitimate properties are left untouched.
        const resultVariables = new Set<string>()
        for (const match of normalized.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+get(?:Sql|Db)\s*\(\s*\)\s*\(/g)) {
          resultVariables.add(match[1])
        }
        for (const variable of neonVariables) {
          const pattern = new RegExp(`\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*await\\s+${variable}\\s*\\(`, "g")
          for (const match of normalized.matchAll(pattern)) resultVariables.add(match[1])
        }

        for (const resultVariable of resultVariables) {
          normalized = normalized
            .replace(
              new RegExp(`\\b${resultVariable}\\.rows\\b`, "g"),
              resultVariable,
            )
            .replace(
              new RegExp(`\\b${resultVariable}\\.rowCount\\b`, "g"),
              `${resultVariable}.length`,
            )
        }

        return [path, normalized]
      }))
    }
  }

  // Keep provider compatibility repairs in the same pre-build normalization pass.
  // This makes both old and newly generated projects safe to build before optional
  // Resend secrets are configured on their Vercel preview deployment.
  return normalizeGeneratedResendUsage(normalizedFiles)
}

export function changedGeneratedFiles(
  before: Record<string, string>,
  after: Record<string, string>,
) {
  return Object.fromEntries(
    Object.entries(after).filter(([path, content]) => before[path] !== content),
  )
}
