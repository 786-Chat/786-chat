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

  for (const [path, source] of Object.entries(runtimeFiles)) {
    if (!/^server\/.*\.(?:ts|tsx)$/i.test(path)) continue
    runtimeFiles[path] = source.startsWith("// @ts-nocheck")
      ? source
      : `// @ts-nocheck\n${source}`
  }

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
    '// Use an explicit .js extension because Vercel emits this bridge as ESM index.js.',
    '// TypeScript/Vercel resolves this to server/index.ts during packaging and Node can resolve server/index.js at runtime.',
    'import { app } from "./server/index.js"',
    "void express",
    "export default app",
    "",
  ].join("\n")
}

export function runtimeDeploymentFiles(files: Record<string, string>): Record<string, string> {
  const runtimeFiles = { ...files }

  prepareImportedExpressRuntime(runtimeFiles)

  for (const [path, source] of Object.entries(runtimeFiles)) {
    if (/^sql\/(?:schema\.sql|migrations\/.+\.sql)$/i.test(path)) {
      runtimeFiles[path] = source.replace(/-->\s*statement-breakpoint\s*/gi, "\n")
    }
  }

  const initialMigration = runtimeFiles["sql/migrations/001_initial.sql"]?.trim()
  const schemaSnapshot = runtimeFiles["sql/schema.sql"]?.trim()

  if (!initialMigration || !schemaSnapshot) return runtimeFiles

  delete runtimeFiles["sql/schema.sql"]
  return runtimeFiles
}
