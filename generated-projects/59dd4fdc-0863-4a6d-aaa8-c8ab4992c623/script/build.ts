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
        );
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
      "process.env.NODE_ENV": '"production"',
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
