import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, resolve } from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/genai",
  "p-retry",
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

const runtimeJsAliasPlugin = {
  name: "786-runtime-js-alias",
  setup(build: any) {
    build.onResolve({ filter: /^\.{1,2}\/.*\.js$/ }, (args: any) => {
      const basePath = resolve(dirname(args.importer), args.path.slice(0, -3));
      for (const candidate of [basePath + ".ts", basePath + ".tsx", resolve(basePath, "index.ts"), resolve(basePath, "index.tsx")]) {
        if (existsSync(candidate)) return { path: candidate };
      }
      return null;
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
    plugins: [runtimeJsAliasPlugin],
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
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
