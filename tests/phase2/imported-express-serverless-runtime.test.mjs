import assert from "node:assert/strict"
import test from "node:test"

import { runtimeDeploymentFiles } from "../../lib/786-admin/runtime-deployment-files.ts"

test("imported Express runtime emits resolvable directory imports and skips listen on Vercel", () => {
  const originalServer = [
    'import express from "express"',
    'import { registerImageRoutes } from "./replit_integrations/image.js"',
    'import { registerRoutes } from "./routes"',
    "const app = express();",
    "const httpServer = createServer(app);",
    "httpServer.listen(5000);",
    'const openai = new OpenAI({ apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY });',
    'const publicPath = path.resolve(__dirname, "public");',
  ].join("\n")

  const output = runtimeDeploymentFiles({
    "package.json": JSON.stringify({ dependencies: { express: "^4.21.2" } }),
    "tsconfig.json": JSON.stringify({ compilerOptions: { paths: { "@shared/*": ["./shared/*"] } } }),
    "server/index.ts": originalServer,
    "server/routes.ts": [
      'import * as schema from "@shared/schema"',
      "export const registerRoutes = () => schema",
    ].join("\n"),
    "shared/schema.ts": [
      'export * from "./models/chat"',
      "export const restaurants = true",
    ].join("\n"),
    "shared/models/chat.ts": "export const conversations = true",
    "server/replit_integrations/image/index.ts": "export const registerImageRoutes = () => undefined",
  })

  assert.match(output["server/index.ts"], /from "\.\/replit_integrations\/image\/index\.js"/)
  assert.match(output["server/index.ts"], /from "\.\/routes\.js"/)
  assert.match(output["server/index.ts"], /if \(!process\.env\.VERCEL\) httpServer\.listen\(5000\)/)
  assert.match(output["server/index.ts"], /OPENAI_API_KEY \|\| "786-chat-disabled"/)
  assert.match(output["server/index.ts"], /path\.resolve\(process\.cwd\(\), "dist", "public"\)/)
  assert.doesNotMatch(output["server/index.ts"], /\b__dirname\b/)
  assert.match(output["server/routes.ts"], /from "\.\.\/shared\/schema\.js"/)
  assert.doesNotMatch(output["server/routes.ts"], /@shared\/schema/)
  assert.match(output["shared/schema.ts"], /from "\.\/models\/chat\.js"/)
  assert.equal(originalServer.includes("process.env.VERCEL"), false)
})
