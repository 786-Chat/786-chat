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
    "server/index.ts": originalServer,
    "server/routes.ts": "export const registerRoutes = () => undefined",
    "server/replit_integrations/image/index.ts": "export const registerImageRoutes = () => undefined",
  })

  assert.match(output["server/index.ts"], /from "\.\/replit_integrations\/image\/index\.js"/)
  assert.match(output["server/index.ts"], /from "\.\/routes\.js"/)
  assert.match(output["server/index.ts"], /if \(!process\.env\.VERCEL\) httpServer\.listen\(5000\)/)
  assert.match(output["server/index.ts"], /OPENAI_API_KEY \|\| "786-chat-disabled"/)
  assert.match(output["server/index.ts"], /path\.resolve\(process\.cwd\(\), "dist", "public"\)/)
  assert.doesNotMatch(output["server/index.ts"], /\b__dirname\b/)
  assert.equal(originalServer.includes("process.env.VERCEL"), false)
})
