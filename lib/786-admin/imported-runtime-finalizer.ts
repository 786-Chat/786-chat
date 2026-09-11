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
      "  // Vite/Rollup are development-only. Keep them out of Vercel cold start.",
      "  const [{ createServer: createViteServer, createLogger }, viteConfigModule] = await Promise.all([",
      '    import("vite"),',
      '    import("../vite.config.js"),',
      "  ]);",
      "  const viteConfig = viteConfigModule.default;",
      "  const viteLogger = createLogger();",
    ].join("\n"),
  )

  files[vitePath] = source
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
    /const runtimeApp = runtime\.app \?\? runtime\.default\?\.app \?\? runtime\.default;\s*if \(!runtimeApp\) \{\s*throw new Error\("Imported Express runtime did not export an app"\);\s*\}\s*app\.use\(runtimeApp\);/m,
    [
      `const importedRuntimeAssets = ${JSON.stringify(assets, null, 2)};`,
      "let importedRuntimePromise: Promise<any> | null = null;",
      "",
      "async function loadImportedRuntime() {",
      "  if (!importedRuntimePromise) {",
      "    importedRuntimePromise = (async () => {",
      '      const runtimeRoot = process.env.TMPDIR || "/tmp";',
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

  for (const [filePath, source] of Object.entries(runtimeFiles)) {
    if (!/^(?:server|shared)\/.*\.(?:ts|tsx|js|jsx)$/i.test(filePath)) continue
    runtimeFiles[filePath] = rewriteServerlessWritablePaths(source)
  }

  lazyLoadViteInProductionRuntime(runtimeFiles)
  hydrateImportedAssetsBeforeRuntime(runtimeFiles)
  return runtimeFiles
}
