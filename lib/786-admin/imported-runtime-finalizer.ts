function rewriteServerlessWritablePaths(source: string): string {
  let next = source.replace(
    /path\.(resolve|join)\(\s*process\.cwd\(\)\s*,\s*(["'])(uploads|data|backup|attached_assets)\2\s*\)/gi,
    (_full, method: string, _quote: string, directory: string) =>
      `path.${method}(process.env.TMPDIR || "/tmp", ${JSON.stringify(directory)})`,
  )

  // Imported PDF/report generators commonly resolve immutable binary templates
  // from process.cwd()/server/templates. These binaries live in the managed
  // import asset map, so point the runtime copy at the hydrated /tmp mirror.
  next = next.replace(
    /path\.(resolve|join)\(\s*process\.cwd\(\)\s*,\s*(["'])server\2\s*,\s*(["'])templates\3\s*\)/gi,
    (_full, method: string) =>
      `path.${method}(process.env.TMPDIR || "/tmp", "server", "templates")`,
  )

  return next
}

const REMOTE_BINARY_ASSET_IMPORT =
  /import\s+([A-Za-z_$][\w$]*)\s+from\s+(["'])(https?:\/\/[^"'\s]+\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|mp3|ogg|wav|mp4|webm|pdf|woff2?|ttf|otf)(?:[?#][^"']*)?)\2\s*;?/gi

function rewriteRemoteBinaryAssetModuleImports(files: Record<string, string>) {
  for (const [filePath, source] of Object.entries(files)) {
    if (!/\.(?:c?js|mjs|jsx|ts|tsx)$/i.test(filePath)) continue
    if (!source.includes("http://") && !source.includes("https://")) continue

    files[filePath] = source.replace(
      REMOTE_BINARY_ASSET_IMPORT,
      (_statement, variable: string, _quote: string, url: string) =>
        `const ${variable} = ${JSON.stringify(url)}; // 786.Chat: imported binary asset URL`,
    )
  }
}

function lazyLoadViteInProductionRuntime(files: Record<string, string>) {
  const vitePath = "server/vite.ts"
  let source = files[vitePath]
  if (!source?.includes('from "vite"') && !source?.includes("from 'vite'")) return
  if (!source.includes("export async function setupVite")) return

  source = source
    .replace(/import\s*\{\s*createServer\s+as\s+createViteServer\s*,\s*createLogger\s*\}\s*from\s*["']vite["'];?\s*/g, "")
    .replace(/import\s+viteConfig\s+from\s*["']\.\.\/vite\.config(?:\.js)?["'];?\s*/g, "")
    .replace(/const\s+viteLogger\s*=\s*createLogger\(\);?\s*/g, "")

  const setupSignature = /export async function setupVite\(app: Express, server: Server\)\s*\{/
  if (!setupSignature.test(source)) return

  source = source.replace(
    setupSignature,
    [
      "export async function setupVite(app: Express, server: Server) {",
      "  // Vite/Rollup are development-only. Keep them out of Vercel cold start and",
      "  // keep the local vite.config module outside esbuild's production server graph.",
      '  const viteModuleName = "vite";',
      '  const viteConfigModuleName = "../vite.config.js";',
      "  const [{ createServer: createViteServer, createLogger }, viteConfigModule] = await Promise.all([",
      "    import(viteModuleName),",
      "    import(viteConfigModuleName),",
      "  ]);",
      "  const viteConfig = viteConfigModule.default;",
      "  const viteLogger = createLogger();",
    ].join("\n"),
  )

  files[vitePath] = source
}

function forceProductionBootstrapOnVercel(files: Record<string, string>) {
  for (const entryPath of ["server/index.ts", "server/index.js"]) {
    let source = files[entryPath]
    if (!source) continue

    // Some imported Express apps default to development when NODE_ENV is absent.
    // Never enter their Vite/Rollup dev server path inside a Vercel function.
    source = source.replace(
      /if\s*\(\s*app\.get\(\s*["']env["']\s*\)\s*===\s*["']development["']\s*\)\s*\{/g,
      'if (!process.env.VERCEL && app.get("env") === "development") {',
    )
    source = source.replace(
      /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*["']development["']\s*\)\s*\{/g,
      'if (!process.env.VERCEL && process.env.NODE_ENV === "development") {',
    )

    files[entryPath] = source
  }
}

function ensureImportedDatabaseRuntime(files: Record<string, string>) {
  const source = files["server/db.ts"] || files["server/db.js"]
  if (!source?.trim()) return
  if (!/DATABASE_URL|@neondatabase\/serverless|drizzle-orm/i.test(source)) return

  // The generated-runtime deployer detects database-backed apps through these
  // runtime-only markers. Imported Replit apps commonly keep their real DB client
  // at server/db.ts and ship Drizzle schema definitions without SQL migrations.
  // Preserve that source unchanged while still provisioning an isolated Neon DB
  // and injecting DATABASE_URL/AUTH_SECRET into the Vercel project.
  if (!files["lib/server/db.ts"]?.trim()) {
    files["lib/server/db.ts"] = [
      "// 786.Chat runtime-only database marker for an imported application.",
      "// The imported application continues to use server/db.ts unchanged.",
      "",
    ].join("\n")
  }

  if (!files["sql/schema.sql"]?.trim() && !files["sql/migrations/001_initial.sql"]?.trim()) {
    files["sql/migrations/001_initial.sql"] = [
      "-- 786.Chat runtime-only bootstrap for an imported database-backed app.",
      "-- Source schemas remain authoritative; this creates the isolated database",
      "-- so the imported runtime receives DATABASE_URL before cold start.",
      "SELECT 1;",
      "",
    ].join("\n")
  }
}

function hardenImportedReplitAuth(files: Record<string, string>) {
  for (const authPath of ["server/replitAuth.ts", "server/replitAuth.js"]) {
    let source = files[authPath]
    if (!source?.includes("REPLIT_DOMAINS")) continue

    // Replit's OIDC variables do not exist on a Vercel preview. Keep branch/custom
    // session auth available there, but do not crash the whole imported server just
    // because the optional Replit identity provider is absent.
    source = source.replace(
      /if\s*\(\s*!process\.env\.REPLIT_DOMAINS\s*\)\s*\{/g,
      "if (!process.env.REPLIT_DOMAINS && !process.env.VERCEL) {",
    )

    // Imported Replit apps often expect a pre-existing sessions table and a Replit
    // SESSION_SECRET. Vercel gets an isolated Neon DB plus 786.Chat AUTH_SECRET, so
    // let connect-pg-simple create only its session table and reuse that secret.
    source = source.replace(
      /createTableIfMissing\s*:\s*false/g,
      "createTableIfMissing: Boolean(process.env.VERCEL)",
    )
    source = source.replace(
      /secret\s*:\s*process\.env\.SESSION_SECRET!/g,
      "secret: (process.env.SESSION_SECRET || process.env.AUTH_SECRET)!",
    )

    const configLine = "  const config = await getOidcConfig();"
    if (source.includes(configLine) && !source.includes("786.Chat: Replit OIDC is optional on Vercel")) {
      source = source.replace(
        configLine,
        [
          "  // 786.Chat: Replit OIDC is optional on Vercel. Custom admin/branch",
          "  // sessions still work through the PostgreSQL session middleware above.",
          "  if (process.env.VERCEL && (!process.env.REPLIT_DOMAINS || !process.env.REPL_ID)) {",
          "    passport.serializeUser((user: Express.User, cb) => cb(null, user));",
          "    passport.deserializeUser((user: Express.User, cb) => cb(null, user));",
          "    return;",
          "  }",
          "",
          configLine,
        ].join("\n"),
      )
    }

    files[authPath] = source
  }
}

function importedServerAssets(files: Record<string, string>): Record<string, string> {
  const source = files["migration/asset-map.json"]
  if (!source?.trim()) return {}
  try {
    const parsed = JSON.parse(source) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).filter(([path, url]) =>
        typeof url === "string" &&
        /^https:\/\//i.test(url) &&
        /^(?:server\/|attached_assets\/)/i.test(path) &&
        !path.includes("..") &&
        !path.startsWith("/"),
      ) as Array<[string, string]>,
    )
  } catch {
    return {}
  }
}

function hydrateImportedAssetsBeforeRuntime(files: Record<string, string>) {
  let bridge = files["index.ts"]
  if (!bridge?.includes("Imported Express runtime did not export an app")) return
  if (!bridge.includes('import * as runtime from "./dist/')) return

  const assets = importedServerAssets(files)
  const runtimeImport = bridge.match(/import \* as runtime from ("\.\/dist\/[^"\n]+";)/)
  if (!runtimeImport) return
  const runtimeSpecifier = runtimeImport[1].replace(/;$/, "")

  bridge = bridge.replace(runtimeImport[0], 'import path from "path";')
  bridge = bridge.replace(
    'const runtimeOwned =\n    req.path === "/api" ||',
    'const runtimeOwned =\n    req.path === "/__786-runtime-health" ||\n    req.path === "/api" ||',
  )
  bridge = bridge.replace(
    /const runtimeApp = runtime\.app \?\? runtime\.default\?\.app \?\? runtime\.default;\s*if \(!runtimeApp\) \{\s*throw new Error\("Imported Express runtime did not export an app"\);\s*\}\s*app\.use\(runtimeApp\);/m,
    [
      `const importedRuntimeAssets = ${JSON.stringify(assets, null, 2)};`,
      "let importedRuntimePromise: Promise<any> | null = null;",
      "",
      "async function loadImportedRuntime() {",
      "  if (!importedRuntimePromise) {",
      "    importedRuntimePromise = (async () => {",
      '      const runtimeRoot = process.env.TMPDIR || "/tmp";',
      '      if (process.env.VERCEL) process.env.NODE_ENV = "production";',
      "      process.chdir(runtimeRoot);",
      "      await Promise.all(Object.entries(importedRuntimeAssets).map(async ([relativePath, url]) => {",
      "        const destination = path.join(runtimeRoot, relativePath);",
      "        await fs.promises.mkdir(path.dirname(destination), { recursive: true });",
      "        const response = await fetch(url);",
      "        if (!response.ok) throw new Error(`Imported runtime asset fetch failed: ${relativePath} (${response.status})`);",
      "        await fs.promises.writeFile(destination, Buffer.from(await response.arrayBuffer()));",
      "      }));",
      `      const runtime = await import(${runtimeSpecifier});`,
      "      const runtimeApp = runtime.app ?? runtime.default?.app ?? runtime.default;",
      "      if (!runtimeApp) {",
      '        throw new Error("Imported Express runtime did not export an app");',
      "      }",
      "      return runtimeApp;",
      "    })();",
      "  }",
      "  return importedRuntimePromise;",
      "}",
      "",
      'app.get("/__786-runtime-health", async (_req, res, next) => {',
      "  try {",
      "    await loadImportedRuntime();",
      "    return res.status(204).end();",
      "  } catch (error) {",
      "    return next(error);",
      "  }",
      "});",
      "",
      "app.use(async (req, res, next) => {",
      "  try {",
      "    const runtimeApp = await loadImportedRuntime();",
      "    return runtimeApp(req, res, next);",
      "  } catch (error) {",
      "    return next(error);",
      "  }",
      "});",
    ].join("\n"),
  )

  files["index.ts"] = bridge
}

export function finalizeImportedRuntimeFiles(files: Record<string, string>): Record<string, string> {
  const runtimeFiles = { ...files }

  // Browser ESM cannot import a remote PNG/JPG/etc URL as a JavaScript module.
  // Imported ZIP asset rewriting can leave those URLs in default import statements;
  // turn them into ordinary string constants before Vite bundles the client.
  rewriteRemoteBinaryAssetModuleImports(runtimeFiles)

  for (const [filePath, source] of Object.entries(runtimeFiles)) {
    if (!/^(?:server|shared)\/.*\.(?:ts|tsx|js|jsx)$/i.test(filePath)) continue
    runtimeFiles[filePath] = rewriteServerlessWritablePaths(source)
  }

  ensureImportedDatabaseRuntime(runtimeFiles)
  hardenImportedReplitAuth(runtimeFiles)
  lazyLoadViteInProductionRuntime(runtimeFiles)
  forceProductionBootstrapOnVercel(runtimeFiles)
  hydrateImportedAssetsBeforeRuntime(runtimeFiles)
  return runtimeFiles
}
