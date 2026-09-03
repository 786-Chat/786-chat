function prepareImportedExpressRuntime(runtimeFiles: Record<string, string>) {
  const packageSource = runtimeFiles["package.json"]
  const serverPath = "server/index.ts"
  const serverSource = runtimeFiles[serverPath]
  if (!packageSource?.trim() || !serverSource?.trim()) return

  let usesExpress = false
  try {
    const pkg = JSON.parse(packageSource) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    usesExpress = Boolean(pkg.dependencies?.express || pkg.devDependencies?.express)
  } catch {
    return
  }
  if (!usesExpress) return

  // Vercel's zero-config Express detector only recognizes root/src entrypoints that
  // directly import Express and export the actual Express app (or start a listener).
  // Replit projects commonly keep the app in server/index.ts, so expose that app only
  // in this runtime copy. The imported/saved project source is never rewritten.
  let nextServerSource = serverSource
  if (!/\bexport\s+(?:const|let|var)\s+app\s*=\s*express\s*\(/.test(nextServerSource)) {
    nextServerSource = nextServerSource.replace(
      /\b(const|let|var)\s+app\s*=\s*express\s*\(\s*\)\s*;/,
      "export $1 app = express();",
    )
  }

  if (!/\bexport\s+(?:const|let|var)\s+app\s*=\s*express\s*\(/.test(nextServerSource)) return

  runtimeFiles[serverPath] = nextServerSource
  runtimeFiles["index.ts"] = [
    "// 786.Chat runtime-only Vercel Express bridge. Saved imported source is unchanged.",
    'import express from "express"',
    'import { app } from "./server/index"',
    "void express",
    "export default app",
    "",
  ].join("\n")
}

export function runtimeDeploymentFiles(files: Record<string, string>): Record<string, string> {
  // Work on a runtime-only copy so imported/saved project source is never rewritten.
  const runtimeFiles = { ...files }

  prepareImportedExpressRuntime(runtimeFiles)

  // Drizzle migration exports separate statements with `--> statement-breakpoint`.
  // The Neon HTTP driver executes one prepared statement at a time, so normalize those
  // markers to newlines before the runtime database deployer splits on semicolons.
  for (const [path, source] of Object.entries(runtimeFiles)) {
    if (/^sql\/(?:schema\.sql|migrations\/.+\.sql)$/i.test(path)) {
      runtimeFiles[path] = source.replace(/-->\s*statement-breakpoint\s*/gi, "\n")
    }
  }

  const initialMigration = runtimeFiles["sql/migrations/001_initial.sql"]?.trim()
  const schemaSnapshot = runtimeFiles["sql/schema.sql"]?.trim()

  if (!initialMigration || !schemaSnapshot) return runtimeFiles

  // The generated runtime database deployer treats sql/schema.sql as the base when it
  // exists. Some long-lived projects keep schema.sql as a small latest-feature snapshot
  // while 001_initial.sql contains the real base tables. Hide the partial snapshot only
  // for runtime provisioning so migrations always start from 001_initial.sql. The saved
  // project files and the published generated source remain unchanged.
  delete runtimeFiles["sql/schema.sql"]
  return runtimeFiles
}
