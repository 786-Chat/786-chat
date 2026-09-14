import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile } from "fs/promises";
import { existsSync } from "fs";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "@neondatabase/serverless",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Replit-specific runtime assumptions are adapted only in the bundled Vercel
// server output. The saved/imported application source remains otherwise intact.
const vercelRuntimeCompatibilityPlugin = {
  name: "vercel-runtime-compatibility",
  setup(build: any) {
    build.onLoad({ filter: /server[\\/]routes\.ts$/ }, async (args: any) => {
      let contents = await readFile(args.path, "utf-8");
      contents = contents
        .replace(
          'const uploadDir = path.join(process.cwd(), "uploads");',
          'const uploadDir = process.env.VERCEL ? "/tmp/uploads" : path.join(process.cwd(), "uploads");',
        )
        .replace(
          'const filepath = path.join(process.cwd(), "uploads", fname);',
          'const filepath = path.join(uploadDir, fname);',
        )
        .replace(
          'const wss = new WebSocketServer({ server: httpServer, path: "/ws" });',
          'const wss = process.env.VERCEL ? new WebSocketServer({ noServer: true }) : new WebSocketServer({ server: httpServer, path: "/ws" });',
        );
      return { contents, loader: "ts" };
    });

    build.onLoad({ filter: /server[\\/]index\.ts$/ }, async (args: any) => {
      let contents = await readFile(args.path, "utf-8");

      const serverDeclaration = `export const app = express();\nconst httpServer = createServer(app);`;
      const serverlessDeclaration = `export const app = express();\nconst httpServer = createServer(app);\nconst isServerlessRuntime = Boolean(\n  process.env.VERCEL ||\n  process.env.AWS_LAMBDA_FUNCTION_NAME ||\n  process.env.LAMBDA_TASK_ROOT ||\n  process.cwd().startsWith(\"/var/task\"),\n);`;

      if (!contents.includes(serverDeclaration)) {
        throw new Error("FoodSafetyMenu Express server declaration was not found for Vercel compatibility patch");
      }
      contents = contents.replace(serverDeclaration, serverlessDeclaration);

      const listenBlock = `  // LISTEN ON PORT FIRST so deployment health checks pass immediately\n  const port = parseInt(process.env.PORT || \"5000\", 10);\n  httpServer.listen({ port, host: \"0.0.0.0\", reusePort: true }, () => {\n    log(\`serving on port \${port}\`);\n  });`;
      const serverlessListenBlock = `  // Replit needs a listening HTTP server. Vercel invokes the exported Express\n  // app directly, so binding a port inside a serverless function crashes the\n  // invocation. Keep the original listener only outside serverless runtimes.\n  const port = parseInt(process.env.PORT || \"5000\", 10);\n  if (!isServerlessRuntime) {\n    httpServer.listen({ port, host: \"0.0.0.0\", reusePort: true }, () => {\n      log(\`serving on port \${port}\`);\n    });\n  }`;

      if (!contents.includes(listenBlock)) {
        throw new Error("FoodSafetyMenu HTTP listener was not found for Vercel compatibility patch");
      }
      contents = contents.replace(listenBlock, serverlessListenBlock);

      const websocketBlock = `  // Setup grocery WebSocket on /grocery-ws path\n  const { WebSocketServer } = await import(\"ws\");\n  const groceryWss = new WebSocketServer({ server: httpServer, path: \"/grocery-ws\" });\n  setupGroceryWebSocket(groceryWss);\n\n  // Setup taxi WebSocket on /taxi-ws path\n  setupTaxiWebSocket(httpServer);\n\n  // Setup clothing WebSocket on /clothing-ws path\n  const { setupClothingWebSocket } = await import(\"./clothing-routes\");\n  setupClothingWebSocket(httpServer);\n\n  // Setup furniture WebSocket on /furniture-ws path\n  const { setupFurnitureWebSocket } = await import(\"./furniture-routes\");\n  setupFurnitureWebSocket(httpServer);`;
      const serverlessWebsocketBlock = `  // Vercel Functions do not expose a persistent Node HTTP server for WebSocket\n  // upgrades. Preserve all HTTP/API behaviour and only attach the Replit socket\n  // servers when this app is running as a normal long-lived Node process.\n  if (!isServerlessRuntime) {\n    const { WebSocketServer } = await import(\"ws\");\n    const groceryWss = new WebSocketServer({ server: httpServer, path: \"/grocery-ws\" });\n    setupGroceryWebSocket(groceryWss);\n    setupTaxiWebSocket(httpServer);\n    const { setupClothingWebSocket } = await import(\"./clothing-routes\");\n    setupClothingWebSocket(httpServer);\n    const { setupFurnitureWebSocket } = await import(\"./furniture-routes\");\n    setupFurnitureWebSocket(httpServer);\n  }`;

      if (!contents.includes(websocketBlock)) {
        throw new Error("FoodSafetyMenu WebSocket startup block was not found for Vercel compatibility patch");
      }
      contents = contents.replace(websocketBlock, serverlessWebsocketBlock);

      return { contents, loader: "ts" };
    });

    build.onLoad({ filter: /server[\\/]uploads\.ts$/ }, async (args: any) => {
      let contents = await readFile(args.path, "utf-8");
      const eagerOpenAI = `// Initialize OpenAI with Replit AI Integrations\nconst openai = new OpenAI({\n  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,\n  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,\n});`;
      const lazyOpenAI = `// Replit supplies AI credentials at runtime. On Vercel, do not construct\n// the client until an AI-only endpoint is actually called, so normal restaurant\n// pages can boot even when that optional integration is not configured.\nlet openaiClient: OpenAI | null = null;\nfunction getOpenAI(): OpenAI {\n  if (openaiClient) return openaiClient;\n  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;\n  if (!apiKey) {\n    throw new Error(\"OpenAI integration is not configured for this deployment\");\n  }\n  openaiClient = new OpenAI({\n    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,\n    apiKey,\n  });\n  return openaiClient;\n}`;

      if (!contents.includes(eagerOpenAI)) {
        throw new Error("FoodSafetyMenu OpenAI runtime initializer was not found for Vercel compatibility patch");
      }

      contents = contents
        .replace(eagerOpenAI, lazyOpenAI)
        .replaceAll("openai.chat.completions.create", "getOpenAI().chat.completions.create")
        .replaceAll("openai.images.generate", "getOpenAI().images.generate");
      return { contents, loader: "ts" };
    });
  },
};

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '\"production\"',
    },
    minify: true,
    external: externals,
    plugins: [vercelRuntimeCompatibilityPlugin],
    logLevel: "info",
  });

  if (existsSync("server/grocery-seed-data.json")) {
    await copyFile("server/grocery-seed-data.json", "dist/grocery-seed-data.json");
    console.log("copied grocery-seed-data.json to dist/");
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
