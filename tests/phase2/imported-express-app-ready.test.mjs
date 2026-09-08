import assert from "node:assert/strict"
import test from "node:test"

import { runtimeDeploymentFiles } from "../../lib/786-admin/runtime-deployment-files.ts"

test("imported Express Vercel bridge waits for async appReady startup", () => {
  const output = runtimeDeploymentFiles({
    "package.json": JSON.stringify({ dependencies: { express: "^4.21.2" } }),
    "script/build.ts": [
      'import { build as esbuild } from "esbuild"',
      "const allowlist = []",
      "await esbuild({ bundle: true })",
    ].join("\n"),
    "vercel.json": JSON.stringify({ framework: "express", buildCommand: "npm run build" }),
    "tsconfig.json": JSON.stringify({ compilerOptions: {} }),
    "server/index.ts": [
      'import express from "express"',
      "const app = express();",
      "const httpServer = createServer(app);",
      "let appReady = false;",
      "app.use((req, res, next) => {",
      "  if (!appReady && !req.path.startsWith('/api/')) return res.status(200).send('Loading...');",
      "  next();",
      "});",
      "(async () => {",
      "  httpServer.listen(5000);",
      "  await registerRoutes(httpServer, app);",
      "  appReady = true;",
      "})();",
    ].join("\n"),
    "server/routes.ts": "export async function registerRoutes() {}",
  })

  assert.match(output["server/index.ts"], /export const runtimeReady = \(async \(\) => \{/)
  assert.match(output["server/index.ts"], /appReady = true/)
  assert.match(output["server/index.ts"], /if \(!process\.env\.VERCEL\) httpServer\.listen\(5000\)/)
  assert.match(output["index.ts"], /runtime\.runtimeReady/)
  assert.match(output["index.ts"], /await runtime\.runtimeReady/)
  assert.match(output["index.ts"], /return runtime\.app\(req, res\)/)
})
