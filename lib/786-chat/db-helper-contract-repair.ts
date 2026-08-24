function authModulePath(files: Record<string, string>) {
  return files["lib/server/auth.ts"]
    ? "lib/server/auth.ts"
    : files["src/lib/server/auth.ts"]
      ? "src/lib/server/auth.ts"
      : null
}

function isExported(source: string, name: string) {
  return new RegExp(`\\bexport\\s+(?:(?:async)\\s+)?(?:function|const|let)\\s+${name}\\b`).test(source) ||
    new RegExp(`\\bexport\\s*\\{[^}]*\\b${name}\\b`).test(source)
}

function exportExistingDeclaration(source: string, name: string) {
  let repaired = source.replace(
    new RegExp(`\\b(async\\s+)?function\\s+${name}\\b`),
    (_statement, asyncPrefix: string | undefined) => `export ${asyncPrefix || ""}function ${name}`,
  )
  if (repaired === source) {
    repaired = source.replace(
      new RegExp(`\\b(const|let)\\s+${name}\\b`),
      (_statement, declaration: string) => `export ${declaration} ${name}`,
    )
  }
  return repaired
}

function generatedPathFromTypeScriptLog(files: Record<string, string>, logs: string) {
  for (const match of logs.matchAll(/(?:^|\n)([^\n()]+\.(?:ts|tsx))\((\d+),(\d+)\):\s*error\s+TS\d+:/gi)) {
    const reported = match[1].trim().replace(/^\.\//, "")
    if (files[reported]) return reported
    if (files[`src/${reported}`]) return `src/${reported}`
  }
  return null
}

function repairGeneratedBlobPutBody(files: Record<string, string>, logs: string) {
  if (!/Uint8Array(?:<[^>]+>)?[\s\S]{0,180}PutBody/i.test(logs)) return null
  const reportedPath = generatedPathFromTypeScriptLog(files, logs)
  const candidatePaths = reportedPath
    ? [reportedPath]
    : Object.keys(files).filter((path) => /^(?:src\/)?app\/api\/uploads(?:\/\[id\])?\/route\.ts$/.test(path))
  const repairedFiles: Record<string, string> = {}

  for (const path of candidatePaths) {
    const source = files[path]
    if (!source || !/@vercel\/blob|\bput\s*\(/.test(source)) continue
    const repaired = source
      .replace(/new\s+Uint8Array\s*\(\s*await\s+([^\n;]+?\.arrayBuffer\s*\(\s*\))\s*\)/g, "await $1")
      .replace(/Uint8Array\.from\s*\(\s*await\s+([^\n;]+?\.arrayBuffer\s*\(\s*\))\s*\)/g, "await $1")
    if (repaired !== source) repairedFiles[path] = repaired
  }

  return Object.keys(repairedFiles).length ? repairedFiles : null
}

function repairGeneratedDynamicRouteParams(files: Record<string, string>, logs: string) {
  if (!/(?:Route .* has an invalid|params[\s\S]{0,160}Promise|Promise[\s\S]{0,160}params|invalid.*route handler)/i.test(logs)) return null
  const reportedPath = generatedPathFromTypeScriptLog(files, logs)
  const candidatePaths = reportedPath
    ? [reportedPath]
    : Object.keys(files).filter((path) => /^(?:src\/)?app\/api\/.+\/\[[^/]+\]\/route\.ts$/.test(path))
  const repairedFiles: Record<string, string> = {}

  for (const path of candidatePaths) {
    let source = files[path]
    if (!source || !/\/\[[^/]+\]\/route\.ts$/.test(path) || !/\bparams\b/.test(source)) continue
    const original = source
    source = source.replace(
      /params\s*:\s*\{\s*([^{}]+?)\s*\}/g,
      (_statement, members: string) => `params: Promise<{ ${members.trim()} }>`
    )
    source = source.replace(
      /\b(const|let)\s+\{([^}]+)\}\s*=\s*params\b/g,
      (_statement, declaration: string, members: string) => `${declaration} {${members}} = await params`
    )
    source = source.replace(/\bparams\.([A-Za-z_$][\w$]*)/g, "(await params).$1")
    if (source !== original) repairedFiles[path] = source
  }

  return Object.keys(repairedFiles).length ? repairedFiles : null
}

function repairMissingGeneratedAuthSignSession(files: Record<string, string>, logs: string) {
  const match = logs.match(/Module\s+['"]+[\"]?@\/lib\/server\/auth[\"]?['"]+\s+has no exported member\s+['"]signSession['"]/i)
  if (!match) return null

  const path = authModulePath(files)
  if (!path) return null

  const source = files[path]
  if (isExported(source, "signSession")) return null

  const exported = exportExistingDeclaration(source, "signSession")
  if (exported !== source) return { [path]: exported }

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

function repairMissingGeneratedAuthCurrentUser(files: Record<string, string>, logs: string) {
  const match = logs.match(/Module\s+['"]+[\"]?@\/lib\/server\/auth[\"]?['"]+\s+has no exported member\s+['"]getCurrentUser['"]/i)
  if (!match) return null

  const path = authModulePath(files)
  if (!path) return null

  const source = files[path]
  if (isExported(source, "getCurrentUser")) return null

  const exported = exportExistingDeclaration(source, "getCurrentUser")
  if (exported !== source) return { [path]: exported }

  // Generated projects from older contracts frequently called this helper
  // getSessionUser(). Keep the existing implementation and expose the canonical
  // getCurrentUser() name expected by the planner and generated routes.
  if (/\b(?:export\s+)?async\s+function\s+getSessionUser\b/.test(source) || /\b(?:export\s+)?(?:const|let)\s+getSessionUser\b/.test(source)) {
    return {
      [path]: `${source.trimEnd()}\n\nexport async function getCurrentUser() {\n  return getSessionUser()\n}\n`,
    }
  }

  return null
}

export function repairMissingGeneratedDbHelper(files: Record<string, string>, logs: string) {
  let workingFiles = files
  const compatibilityRepairs: Record<string, string> = {}

  const blobPutBodyRepair = repairGeneratedBlobPutBody(workingFiles, logs)
  if (blobPutBodyRepair) {
    Object.assign(compatibilityRepairs, blobPutBodyRepair)
    workingFiles = { ...workingFiles, ...blobPutBodyRepair }
  }

  const dynamicRouteParamsRepair = repairGeneratedDynamicRouteParams(workingFiles, logs)
  if (dynamicRouteParamsRepair) {
    Object.assign(compatibilityRepairs, dynamicRouteParamsRepair)
    workingFiles = { ...workingFiles, ...dynamicRouteParamsRepair }
  }

  if (Object.keys(compatibilityRepairs).length) return compatibilityRepairs

  const authRepairs: Record<string, string> = {}

  const authSignSessionRepair = repairMissingGeneratedAuthSignSession(workingFiles, logs)
  if (authSignSessionRepair) {
    Object.assign(authRepairs, authSignSessionRepair)
    workingFiles = { ...workingFiles, ...authSignSessionRepair }
  }

  const authCurrentUserRepair = repairMissingGeneratedAuthCurrentUser(workingFiles, logs)
  if (authCurrentUserRepair) {
    Object.assign(authRepairs, authCurrentUserRepair)
    workingFiles = { ...workingFiles, ...authCurrentUserRepair }
  }

  if (Object.keys(authRepairs).length) return authRepairs

  const match = logs.match(/Module\s+['"]+[\"]?@\/lib\/server\/db[\"]?['"]+\s+has no exported member\s+['"](get(?:Sql|Db))['"]/i)
    || logs.match(/Module\s+['"]+[\"]?@\/lib\/server\/db[\"]?['"]+\s+declares\s+['"](get(?:Sql|Db))['"]\s+locally, but it is not exported/i)
  if (!match) return null

  const helper = match[1] as "getDb" | "getSql"
  const sibling = helper === "getDb" ? "getSql" : "getDb"
  const path = workingFiles["lib/server/db.ts"] ? "lib/server/db.ts" : workingFiles["src/lib/server/db.ts"] ? "src/lib/server/db.ts" : null
  if (!path) return null

  const source = workingFiles[path]
  if (isExported(source, helper)) return null

  const repaired = exportExistingDeclaration(source, helper)
  if (repaired !== source) return { [path]: repaired }

  if (isExported(source, sibling)) {
    return { [path]: `${source.trimEnd()}\n\nexport const ${helper} = ${sibling}\n` }
  }

  return null
}
