export type DeterministicGeneratedBuildRepair = {
  files: Record<string, string>
  removedPaths: string[]
  model: string
}

function repairTailwindSemanticTheme(files: Record<string, string>, logs: string) {
  if (!/class does not exist/i.test(logs) || !/app\/globals\.css/i.test(logs)) return null
  const path = files["tailwind.config.ts"] ? "tailwind.config.ts" : files["tailwind.config.js"] ? "tailwind.config.js" : null
  if (!path) return null
  const source = files[path]
  if (!/extend\s*:\s*\{\s*\}/.test(source)) return null
  const extend = `extend: {\n      colors: {\n        border: 'var(--border)',\n        input: 'var(--input)',\n        ring: 'var(--ring)',\n        background: 'var(--background)',\n        foreground: 'var(--foreground)',\n        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },\n        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },\n        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },\n        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },\n        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },\n        card: { DEFAULT: 'var(--background)', foreground: 'var(--foreground)' },\n        popover: { DEFAULT: 'var(--background)', foreground: 'var(--foreground)' },\n      },\n    }`
  const repaired = source.replace(/extend\s*:\s*\{\s*\}/, extend)
  return repaired === source ? null : { [path]: repaired }
}

function repairZeroArgDbFactory(files: Record<string, string>, logs: string) {
  if (!/Expected 0 arguments, but got 1/i.test(logs)) return null
  const dbSource = files["lib/server/db.ts"] || ""
  if (!/export\s+(?:async\s+)?function\s+getDb\s*\(\s*\)/.test(dbSource) && !/export\s+const\s+getDb\s*=\s*\(\s*\)/.test(dbSource)) return null
  const repairedFiles: Record<string, string> = {}
  for (const [path, source] of Object.entries(files)) {
    if (!logs.includes(path) || !/\.(?:ts|tsx)$/.test(path) || !/\bgetDb\s*\(/.test(source)) continue
    const repaired = source.replace(/\bgetDb\s*\(\s*[^()\n]+\s*\)/g, "getDb()")
    if (repaired !== source) repairedFiles[path] = repaired
  }
  return Object.keys(repairedFiles).length ? repairedFiles : null
}

function repairNeonConnectUsage(files: Record<string, string>, logs: string) {
  if (!/Property ['"]connect['"] does not exist on type ['"]?NeonQueryFunction/i.test(logs)) return null
  const dbSource = files["lib/server/db.ts"] || ""
  if (!/@neondatabase\/serverless/.test(dbSource) || !/\bget(?:Db|Sql)\b/.test(dbSource)) return null

  const repairedFiles: Record<string, string> = {}
  for (const [path, source] of Object.entries(files)) {
    if (!logs.includes(path) || !/\.(?:ts|tsx)$/.test(path) || !/\.connect\s*\(\s*\)/.test(source)) continue
    let repaired = source
      .replace(/await\s+(get(?:Db|Sql)\s*\(\s*\))\.connect\s*\(\s*\)/g, "$1")
      .replace(/await\s+([A-Za-z_$][\w$]*)\.connect\s*\(\s*\)/g, "$1")
      .replace(/(get(?:Db|Sql)\s*\(\s*\))\.connect\s*\(\s*\)/g, "$1")
      .replace(/([A-Za-z_$][\w$]*)\.connect\s*\(\s*\)/g, "$1")
      .replace(/^\s*(?:await\s+)?[A-Za-z_$][\w$]*\.release\s*\(\s*\)\s*;?\s*$/gm, "")
    if (repaired !== source) repairedFiles[path] = repaired
  }
  return Object.keys(repairedFiles).length ? repairedFiles : null
}

function repairNeonTaggedQueryRows(files: Record<string, string>, logs: string) {
  if (!/Property ['"](?:0|length)['"] does not exist on type|FullQueryResults|QueryResult.*not.*index/i.test(logs)) {
    return null
  }

  const repairedFiles: Record<string, string> = {}
  for (const [path, source] of Object.entries(files)) {
    if (!logs.includes(path) || !/\.(?:ts|tsx)$/.test(path) || !/await\s+sql`/.test(source)) continue
    const repaired = source.replace(
      /\b(const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+sql(`[^`]*`)\s*;/g,
      (_statement, declaration: string, name: string, query: string) =>
        `${declaration} ${name} = (await sql${query}) as unknown as Array<Record<string, any>>;`,
    )
    if (repaired !== source) repairedFiles[path] = repaired
  }
  return Object.keys(repairedFiles).length ? repairedFiles : null
}

export function deterministicGeneratedBuildRepair(files: Record<string, string>, logs: string): DeterministicGeneratedBuildRepair | null {
  const repairedFiles: Record<string, string> = {}
  const models: string[] = []

  const tailwind = repairTailwindSemanticTheme(files, logs)
  if (tailwind) {
    Object.assign(repairedFiles, tailwind)
    models.push("tailwind-semantic-theme")
  }

  const dbFactory = repairZeroArgDbFactory({ ...files, ...repairedFiles }, logs)
  if (dbFactory) {
    Object.assign(repairedFiles, dbFactory)
    models.push("zero-arg-db-factory")
  }

  const neonConnect = repairNeonConnectUsage({ ...files, ...repairedFiles }, logs)
  if (neonConnect) {
    Object.assign(repairedFiles, neonConnect)
    models.push("neon-serverless-connect-compatibility")
  }

  const neonRows = repairNeonTaggedQueryRows({ ...files, ...repairedFiles }, logs)
  if (neonRows) {
    Object.assign(repairedFiles, neonRows)
    models.push("neon-query-result-array")
  }

  if (!Object.keys(repairedFiles).length) return null
  return {
    files: repairedFiles,
    removedPaths: [],
    model: `deterministic-multi:${models.join("+")}`,
  }
}
