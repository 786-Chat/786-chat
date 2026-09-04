import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile, mkdir } from "fs/promises";
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

// Replit writes uploaded files under process.cwd()/uploads. Vercel's deployed
// function filesystem is read-only except for /tmp. Keep the imported source
// unchanged and patch only the bundled server runtime used for deployment.
const vercelUploadPathPlugin = {
  name: "vercel-upload-path",
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
    plugins: [vercelUploadPathPlugin],
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
