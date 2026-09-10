function normalizeRelativeModulePath(fromPath: string, specifier: string) {
  const fromParts = fromPath.split("/").slice(0, -1)
  for (const part of specifier.split("/")) {
    if (!part || part === ".") continue
    if (part === "..") fromParts.pop()
    else fromParts.push(part)
  }
  return fromParts.join("/")
}

type RuntimeAlias = { key: string; target: string }

function relativeRuntimeSpecifier(fromPath: string, targetPath: string) {
  const fromParts = fromPath.split("/").slice(0, -1)
  const targetParts = targetPath.split("/").filter(Boolean)
  while (fromParts.length && targetParts.length && fromParts[0] === targetParts[0]) {
    fromParts.shift()
    targetParts.shift()
  }
  const relative = [...fromParts.map(() => ".."), ...targetParts].join("/")
  return relative.startsWith(".") ? relative : `./${relative}`
}

function rewriteRuntimeAliases(
  runtimeFiles: Record<string, string>,
  filePath: string,
  source: string,
  aliases: RuntimeAlias[],
) {
  const resolveAlias = (specifier: string) => {
    for (const alias of aliases) {
      const wildcard = alias.key.indexOf("*")
      const prefix = wildcard >= 0 ? alias.key.slice(0, wildcard) : alias.key
      const suffix = wildcard >= 0 ? alias.key.slice(wildcard + 1) : ""
      if (!specifier.startsWith(prefix) || (suffix && !specifier.endsWith(suffix))) continue
      if (wildcard < 0 && specifier !== alias.key) continue
      const value = wildcard >= 0
        ? specifier.slice(prefix.length, suffix ? -suffix.length : undefined)
        : ""
      const target = alias.target.replace("*", value).replace(/^\.\//, "")
      const runtimeTarget = runtimeFiles[`${target}.ts`] || runtimeFiles[`${target}.tsx`]
        ? `${target}.js`
        : runtimeFiles[`${target}/index.ts`] || runtimeFiles[`${target}/index.tsx`]
          ? `${target}/index.js`
          : null
      if (runtimeTarget) return relativeRuntimeSpecifier(filePath, runtimeTarget)
    }
    return null
  }

  const rewrite = (full: string, prefix: string, specifier: string, suffix: string) => {
    const target = resolveAlias(specifier)
    return target ? `${prefix}${target}${suffix}` : full
  }
  return source
    .replace(/(\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["'])([^."'][^"']*)(["'])/g, rewrite)
    .replace(/(\bimport\(\s*["'])([^."'][^"']*)(["']\s*\))/g, rewrite)
}

function addRuntimeJsExtensions(runtimeFiles: Record<string, string>, filePath: string, source: string) {
  const runtimeSpecifier = (specifier: string) => {
    if (!specifier.startsWith(".")) return null
    const sourceSpecifier = specifier.endsWith(".js") ? specifier.slice(0, -3) : specifier
    const resolved = normalizeRelativeModulePath(filePath, sourceSpecifier)
    if (runtimeFiles[`${resolved}.ts`] || runtimeFiles[`${resolved}.tsx`]) {
      return `${sourceSpecifier}.js`
    }
    if (runtimeFiles[`${resolved}/index.ts`] || runtimeFiles[`${resolved}/index.tsx`]) {
      return `${sourceSpecifier}/index.js`
    }
    return null
  }

  const rewrite = (full: string, prefix: string, specifier: string, suffix: string) => {
    if (/\.[a-z0-9]+$/i.test(specifier) && !specifier.endsWith(".js")) return full
    const runtimeTarget = runtimeSpecifier(specifier)
    return runtimeTarget ? `${prefix}${runtimeTarget}${suffix}` : full
  }

  let next = source.replace(
    /(\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["'])(\.{1,2}\/[^"']+)(["'])/g,
    rewrite,
  )
  next = next.replace(
    /(\bimport\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g,
    rewrite,
  )
  return next
}

function patchImportedBuildScript(runtimeFiles: Record<string, string>) {
  const buildPath = "script/build.ts"
  let source = runtimeFiles[buildPath]
  if (!source?.includes('from "esbuild"') || !source.includes("await esbuild({")) return

  // @google/genai's CommonJS entry requires p-retry, whose current package is
  // ESM-only. Both packages must be bundled; bundling only p-retry has no effect
  // while @google/genai itself remains external.
  if (source.includes("const allowlist = [")) {
    const bundledEsmDeps = ["@google/genai", "p-retry"].filter(
      (dependency) => !source.includes(`"${dependency}"`) && !source.includes(`'${dependency}'`),
    )
    if (bundledEsmDeps.length) {
      source = source.replace(
        "const allowlist = [",
        `const allowlist = [\n${bundledEsmDeps.map((dependency) => `  "${dependency}",`).join("\n")}`,
      )
    }
  }

  if (!source.includes('from "path"')) {
    source = source.replace(
      /((?:import[^\n]+\n)+)/,
      `$1import { dirname, resolve } from "path";\n`,
    )
  } else if (!source.includes("dirname") || !source.includes("resolve")) {
    source = source.replace(/import\s*\{([^}]*)\}\s*from\s*["']path["'];?/, (_full, names) => {
      const values = names.split(",").map((value: string) => value.trim()).filter(Boolean)
      if (!values.includes("dirname")) values.push("dirname")
      if (!values.includes("resolve")) values.push("resolve")
      return `import { ${values.join(", ")} } from "path";`
    })
  }

  if (!source.includes("runtimeJsAliasPlugin")) {
    source = source.replace(
      /async function buildAll\(\) \{/,
      `const runtimeJsAliasPlugin = {\n  name: "786-runtime-js-alias",\n  setup(build: any) {\n    build.onResolve({ filter: /^\\.{1,2}\\/.*\\.js$/ }, (args: any) => {\n      const basePath = resolve(dirname(args.importer), args.path.slice(0, -3));\n      for (const candidate of [basePath + ".ts", basePath + ".tsx", resolve(basePath, "index.ts"), resolve(basePath, "index.tsx")]) {\n        if (existsSync(candidate)) return { path: candidate };\n      }\n      return null;\n    });\n  },\n};\n\nasync function buildAll() {`,
    )
  }

  if (!source.includes("plugins: [runtimeJsAliasPlugin]")) {
    source = source.replace(
      /bundle:\s*true,/,
      `bundle: true,\n    plugins: [runtimeJsAliasPlugin],`,
    )
  }

  runtimeFiles[buildPath] = source
}

function makeOptionalAiClientsBootSafe(source: string) {
  // OpenAI and Gemini constructors validate credentials immediately. Imported
  // Replit apps often initialize these optional clients at module scope, which
  // must not prevent unrelated pages and APIs from booting on Vercel.
  return source
    .replace(
      /(apiKey\s*:\s*)process\.env\.AI_INTEGRATIONS_OPENAI_API_KEY(?!\s*\|\|)/g,
      '$1(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "786-chat-disabled")',
    )
    .replace(
      /(apiKey\s*:\s*)process\.env\.OPENAI_API_KEY(?!\s*\|\|)/g,
      '$1(process.env.OPENAI_API_KEY || "786-chat-disabled")',
    )
    .replace(
      /(apiKey\s*:\s*)process\.env\.AI_INTEGRATIONS_GEMINI_API_KEY(?!\s*\|\|)/g,
      '$1(process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "786-chat-disabled")',
    )
}

function makeImportedEsmRuntimeSafe(source: string) {
  // The generated Vercel bridge loads the imported project's CommonJS build.
  // Preserve __dirname because it correctly points at dist/ inside the nested
  // generated-project directory; process.cwd() points at /var/task instead.
  return source
    // Vercel Functions can only write beneath /tmp. Imported Express apps
    // commonly create a local uploads directory at module scope; leaving that
    // rooted at process.cwd() makes every cold start fail because /var/task is
    // read-only. Keep the same directory shape while moving only upload storage
    // to the serverless temporary filesystem.
    .replace(
      /path\.(resolve|join)\(\s*process\.cwd\(\)\s*,\s*(["'])uploads\2\s*\)/gi,
      'path.$1(process.env.TMPDIR || "/tmp", "uploads")',
    )
}

function patchImportedReplitObjectStorage(runtimeFiles: Record<string, string>) {
  const storagePath = "server/objectStorage.ts"
  let source = runtimeFiles[storagePath]
  if (
    !source?.includes("REPLIT_SIDECAR_ENDPOINT") ||
    !source.includes("PUBLIC_OBJECT_SEARCH_PATHS") ||
    !source.includes("async uploadFromBuffer")
  ) {
    return
  }

  try {
    const pkg = JSON.parse(runtimeFiles["package.json"] || "{}") as {
      dependencies?: Record<string, string>
    }
    pkg.dependencies = {
      ...(pkg.dependencies || {}),
      "@vercel/blob": pkg.dependencies?.["@vercel/blob"] || "^2.4.0",
    }
    runtimeFiles["package.json"] = `${JSON.stringify(pkg, null, 2)}\n`
  } catch {
    return
  }

  if (source.includes("786.Chat Vercel Blob compatibility")) return

  const downloadSignature =
    "  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {\n    try {"
  source = source.replace(
    downloadSignature,
    `  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {\n    const vercelBlobPath = (file as unknown as { __vercelBlobPath?: string }).__vercelBlobPath;\n    if (process.env.VERCEL && vercelBlobPath) {\n      try {\n        const { get } = await import("@vercel/blob");\n        const result = await get(vercelBlobPath, { access: "private" });\n        if (!result || result.statusCode !== 200) {\n          res.sendStatus(404);\n          return;\n        }\n        res.set({\n          "Content-Type": result.blob.contentType || "application/octet-stream",\n          "Cache-Control": \`private, max-age=\${cacheTtlSec}\`,\n        });\n        const { Readable } = await import("node:stream");\n        Readable.fromWeb(result.stream as any).pipe(res);\n        return;\n      } catch (error) {\n        console.error("Error serving Vercel Blob:", error);\n        if (!res.headersSent) res.status(500).json({ error: "Error streaming file" });\n        return;\n      }\n    }\n    try {`,
  )

  const entitySignature = "  async getObjectEntityFile(objectPath: string): Promise<File> {\n"
  source = source.replace(
    entitySignature,
    `${entitySignature}    if (process.env.VERCEL && objectPath.startsWith("/objects/vercel/")) {\n      const pathname = decodeURIComponent(objectPath.slice("/objects/vercel/".length));\n      return { __vercelBlobPath: pathname } as unknown as File;\n    }\n`,
  )

  const uploadSignature =
    "  async uploadFromBuffer(buffer: Buffer, filename: string, contentType: string): Promise<string> {\n"
  source = source.replace(
    uploadSignature,
    `${uploadSignature}    // 786.Chat Vercel Blob compatibility: Replit's sidecar is unavailable on Vercel.\n    if (process.env.VERCEL) {\n      const { put } = await import("@vercel/blob");\n      const objectId = randomUUID();\n      const ext = filename.split(".").pop() || "bin";\n      const pathname = \`uploads/\${objectId}.\${ext}\`;\n      await put(pathname, buffer, {\n        access: "private",\n        contentType,\n        addRandomSuffix: false,\n      });\n      return \`/objects/vercel/\${encodeURIComponent(pathname)}\`;\n    }\n`,
  )

  runtimeFiles[storagePath] = source
}

function prepareImportedExpressRuntime(runtimeFiles: Record<string, string>) {
  const packageSource = runtimeFiles["package.json"]
  const serverPath = "server/index.ts"
  const serverSource = runtimeFiles[serverPath]
  if (!packageSource?.trim() || !serverSource?.trim()) return

  let usesExpress = false
  let runtimeAliases: RuntimeAlias[] = []
  try {
    const pkg = JSON.parse(packageSource) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    usesExpress = Boolean(pkg.dependencies?.express || pkg.devDependencies?.express)
    const tsconfig = JSON.parse(runtimeFiles["tsconfig.json"] || "{}") as {
      compilerOptions?: { paths?: Record<string, string[]> }
    }
    runtimeAliases = Object.entries(tsconfig.compilerOptions?.paths || {}).flatMap(([key, targets]) =>
      typeof targets?.[0] === "string" ? [{ key, target: targets[0] }] : [],
    )
  } catch {
    return
  }
  if (!usesExpress) return

  patchImportedReplitObjectStorage(runtimeFiles)

  // Vite writes the imported frontend during the custom build, after Vercel's
  // source scan. Explicitly include that generated directory in the root
  // Express Function bundle; otherwise serveStatic() sees a successful build
  // but /var/task/dist/public does not exist at runtime.
  try {
    const vercelConfig = JSON.parse(runtimeFiles["vercel.json"] || "{}") as {
      functions?: Record<string, { includeFiles?: string }>
    }
    const functions = vercelConfig.functions || {}
    const rootFunction = functions["index.ts"] || {}
    if (!rootFunction.includeFiles) rootFunction.includeFiles = "dist/**"
    else if (!rootFunction.includeFiles.includes("dist/")) {
      rootFunction.includeFiles = `{${rootFunction.includeFiles},dist/**}`
    }
    functions["index.ts"] = rootFunction
    vercelConfig.functions = functions
    runtimeFiles["vercel.json"] = `${JSON.stringify(vercelConfig, null, 2)}\n`
  } catch {
    // Invalid imported config is handled by the normal deployment validator.
  }

  for (const [path, source] of Object.entries(runtimeFiles)) {
    if (!/^(?:server|shared)\/.*\.(?:ts|tsx)$/i.test(path)) continue
    const relaxedSource = source.startsWith("// @ts-nocheck")
      ? source
      : `// @ts-nocheck\n${source}`
    runtimeFiles[path] = makeImportedEsmRuntimeSafe(
      makeOptionalAiClientsBootSafe(
        addRuntimeJsExtensions(
          runtimeFiles,
          path,
          rewriteRuntimeAliases(runtimeFiles, path, relaxedSource, runtimeAliases),
        ),
      ),
    )
  }

  // The runtime copy uses explicit .js specifiers so Node ESM can resolve emitted
  // server files. The imported app's own esbuild step still sees TypeScript sources,
  // so teach that build to map those .js specifiers back to matching .ts/.tsx files,
  // including directory imports that resolve to index.ts/index.tsx.
  patchImportedBuildScript(runtimeFiles)

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

  // Vercel invokes the exported Express app as a function. Opening a TCP listener
  // during module evaluation crashes a serverless cold start (and WebSockets are
  // not supported by Vercel Functions). Preserve normal local/Replit startup while
  // suppressing direct listen() calls in the Vercel runtime copy.
  nextServerSource = nextServerSource.replace(
    /(^|\n)(\s*)([A-Za-z_$][\w$]*\.listen\s*\()/g,
    "$1$2if (!process.env.VERCEL) $3",
  )

  runtimeFiles[serverPath] = nextServerSource
  runtimeFiles["index.ts"] = [
    "// 786.Chat runtime-only Vercel Express bridge. Saved imported source is unchanged.",
    "// @ts-nocheck",
    'import express from "express";',
    'import fs from "fs";',
    'import { fileURLToPath } from "url";',
    'import runtime from "./dist/index.cjs";',
    "",
    "const app = express();",
    'const publicDir = fileURLToPath(new URL("./dist/public/", import.meta.url));',
    'const indexFile = fileURLToPath(new URL("./dist/public/index.html", import.meta.url));',
    "const previewStatic = express.static(publicDir, {",
    "  index: false,",
    "  setHeaders(res, filePath) {",
    '    if (filePath.endsWith(".html")) {',
    '      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");',
    "    }",
    "  },",
    "});",
    "",
    "function isVercelPreviewHost(req: any) {",
    '  const host = String(req.hostname || req.headers?.host || "")',
    '    .split(":")[0]',
    "    .toLowerCase();",
    '  return host.endsWith(".vercel.app");',
    "}",
    "",
    "app.use((req, res, next) => {",
    "  if (!isVercelPreviewHost(req)) return next();",
    "  return previewStatic(req, res, next);",
    "});",
    "",
    "app.use((req, res, next) => {",
    '  if (!isVercelPreviewHost(req) || req.method !== "GET") return next();',
    "",
    "  const runtimeOwned =",
    '    req.path === "/api" ||',
    '    req.path.startsWith("/api/") ||',
    '    req.path === "/uploads" ||',
    '    req.path.startsWith("/uploads/") ||',
    '    req.path === "/attached_assets" ||',
    '    req.path.startsWith("/attached_assets/") ||',
    '    req.path === "/driver-downloads" ||',
    '    req.path.startsWith("/driver-downloads/");',
    "",
    "  if (runtimeOwned || !fs.existsSync(indexFile)) return next();",
    "",
    "  return res",
    "    .status(200)",
    '    .set({ "Cache-Control": "no-cache, no-store, must-revalidate" })',
    "    .sendFile(indexFile);",
    "});",
    "",
    "app.use(runtime.app);",
    "",
    "export default app;",
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