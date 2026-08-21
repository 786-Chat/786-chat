function repairMissingGeneratedAuthSignSession(files: Record<string, string>, logs: string) {
  const match = logs.match(/Module\s+['"]+[\"]?@\/lib\/server\/auth[\"]?['"]+\s+has no exported member\s+['"]signSession['"]/i)
  if (!match) return null

  const path = files["lib/server/auth.ts"] ? "lib/server/auth.ts" : files["src/lib/server/auth.ts"] ? "src/lib/server/auth.ts" : null
  if (!path) return null

  const source = files[path]
  const isExported = (name: string) =>
    new RegExp(`\\bexport\\s+(?:(?:async)\\s+)?(?:function|const|let)\\s+${name}\\b`).test(source) ||
    new RegExp(`\\bexport\\s*\\{[^}]*\\b${name}\\b`).test(source)

  if (isExported("signSession")) return null

  let repaired = source.replace(
    /\b(async\s+)?function\s+signSession\b/,
    (_statement, asyncPrefix: string | undefined) => `export ${asyncPrefix || ""}function signSession`,
  )
  if (repaired === source) {
    repaired = source.replace(
      /\b(const|let)\s+signSession\b/,
      (_statement, declaration: string) => `export ${declaration} signSession`,
    )
  }
  if (repaired !== source) return { [path]: repaired }

  // Most generated auth modules already import jose SignJWT and define the signing
  // secret for createSession. Reuse those exact primitives to restore the stable
  // signSession(payload) contract without changing cookie/session side effects.
  if (/\bSignJWT\b/.test(source) && /\b(?:const|let)\s+secret\b/.test(source)) {
    const implementation = [
      "export async function signSession(payload: { userId: string; companyId?: string | null; email?: string }): Promise<string> {",
      "  return new SignJWT({ userId: payload.userId, companyId: payload.companyId ?? null, email: payload.email })",
      "    .setProtectedHeader({ alg: 'HS256' })",
      "    .setIssuedAt()",
      "    .setExpirationTime('7d')",
      "    .sign(secret)",
      "}",
    ].join("\n")
    return { [path]: `${source.trimEnd()}\n\n${implementation}\n` }
  }

  return null
}

export function repairMissingGeneratedDbHelper(files: Record<string, string>, logs: string) {
  const authSignSessionRepair = repairMissingGeneratedAuthSignSession(files, logs)
  if (authSignSessionRepair) return authSignSessionRepair

  const match = logs.match(/Module\s+['"]+[\"]?@\/lib\/server\/db[\"]?['"]+\s+has no exported member\s+['"](get(?:Sql|Db))['"]/i)
    || logs.match(/Module\s+['"]+[\"]?@\/lib\/server\/db[\"]?['"]+\s+declares\s+['"](get(?:Sql|Db))['"]\s+locally, but it is not exported/i)
  if (!match) return null

  const helper = match[1] as "getDb" | "getSql"
  const sibling = helper === "getDb" ? "getSql" : "getDb"
  const path = files["lib/server/db.ts"] ? "lib/server/db.ts" : files["src/lib/server/db.ts"] ? "src/lib/server/db.ts" : null
  if (!path) return null

  const source = files[path]
  const isExported = (name: string) =>
    new RegExp(`\\bexport\\s+(?:(?:async)\\s+)?(?:function|const|let)\\s+${name}\\b`).test(source) ||
    new RegExp(`\\bexport\\s*\\{[^}]*\\b${name}\\b`).test(source)

  if (isExported(helper)) return null

  let repaired = source.replace(
    new RegExp(`\\b(async\\s+)?function\\s+${helper}\\b`),
    (_statement, asyncPrefix: string | undefined) => `export ${asyncPrefix || ""}function ${helper}`,
  )
  if (repaired === source) {
    repaired = source.replace(
      new RegExp(`\\b(const|let)\\s+${helper}\\b`),
      (_statement, declaration: string) => `export ${declaration} ${helper}`,
    )
  }
  if (repaired !== source) return { [path]: repaired }

  if (isExported(sibling)) {
    return { [path]: `${source.trimEnd()}\n\nexport const ${helper} = ${sibling}\n` }
  }

  return null
}
