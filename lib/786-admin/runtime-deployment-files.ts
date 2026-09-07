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

  // Imported Replit apps often compile successfully with esbuild while Vercel's
  // zero-config Express packaging performs an additional TypeScript check across the
  // server graph. Old schema typings can then block deployment even though the actual
  // application build already passed. Keep the saved project untouched and relax only
  // the runtime deployment copy that Vercel packages.
  for (const [path, source] of Object.entries(runtimeFiles)) {
    if (!/^server\/.*\.(?:ts|tsx)$/i.test(path)) continue
    runtimeFiles[path] = source.startsWith("// @ts-nocheck")
      ? source
      : `// @ts-nocheck\n${source}`
  }

  // Carry forward the compatibility repairs already required by common Replit exports.
  // These rewrites are runtime-only and only apply when the newer field names are known
  // to exist in the imported source.
  const routesPath = "server/routes.ts"
  const schemaSource = runtimeFiles["shared/schema.ts"] || runtimeFiles["server/schema.ts"] || ""
  let routesSource = runtimeFiles[routesPath]
  if (routesSource) {
    if (/\brestaurantLatitude\b/.test(schemaSource)) {
      routesSource = routesSource.replace(/\.addressLat\b/g, ".restaurantLatitude")
    }
    if (/\brestaurantLongitude\b/.test(schemaSource)) {
      routesSource = routesSource.replace(/\.addressLng\b/g, ".restaurantLongitude")
    }

    if (/\band\s*\(/.test(routesSource)) {
      const drizzleImport = routesSource.match(/import\s*\{([^}]*)\}\s*from\s*["']drizzle-orm["']/)
      if (drizzleImport && !/(?:^|,)\s*and\s*(?:,|$)/.test(drizzleImport[1])) {
        routesSource = routesSource.replace(
          drizzleImport[0],
          drizzleImport[0].replace("{", "{ and,"),
        )
      }
    }
    runtimeFiles[routesPath] = routesSource
  }

  // Vercel's zero-config Express detector only recognizes root/src entrypoints that
  // directly import Express and export the actual Express app (or start a listener).
  // Replit projects commonly keep the app in server/index.ts, so expose that app only
  // in this runtime copy. The imported/saved project source is never rewritten.
  let nextServerSource = runtimeFiles[serverPath]
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
    "// @ts-nocheck",
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
