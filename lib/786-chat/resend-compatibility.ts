function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Generated projects must be able to complete a production Next.js build before
 * optional provider secrets have been configured on their preview deployment.
 * Resend throws in its constructor when the API key is missing, so a generated
 * module-level `new Resend(process.env.RESEND_API_KEY)` crashes during Next.js
 * page-data collection even when no email route is being called.
 *
 * Rewrite only the known generated Resend client shape and move construction
 * behind a lazy getter. The getter still fails clearly at request time when a
 * caller actually tries to send email without RESEND_API_KEY configured.
 */
export function normalizeGeneratedResendUsage(files: Record<string, string>) {
  return Object.fromEntries(Object.entries(files).map(([path, content]) => {
    if (!/\.(?:ts|tsx|js|jsx)$/.test(path)) return [path, content]
    if (!/from\s+["']resend["']/.test(content) || !/new\s+Resend\s*\(/.test(content)) {
      return [path, content]
    }
    if (/function\s+getResendClient\s*\(/.test(content)) return [path, content]

    const declarationPattern = /^(\s*)(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+Resend\s*\(\s*process\.env\.RESEND_API_KEY!?\s*\)\s*;?\s*$/m
    const match = content.match(declarationPattern)
    if (!match) return [path, content]

    const variable = match[2]
    const getter = [
      "function getResendClient() {",
      "  const apiKey = process.env.RESEND_API_KEY",
      "  if (!apiKey) {",
      "    throw new Error(\"RESEND_API_KEY is not configured\")",
      "  }",
      "  return new Resend(apiKey)",
      "}",
    ].join("\n")

    const variableUsage = new RegExp(`\\b${escapeRegExp(variable)}\\.`, "g")
    const normalized = content
      .replace(declarationPattern, getter)
      .replace(variableUsage, "getResendClient().")

    return [path, normalized]
  }))
}
