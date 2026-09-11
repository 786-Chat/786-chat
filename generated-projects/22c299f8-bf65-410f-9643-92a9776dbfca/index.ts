// 786.Chat runtime-only Vercel Express bridge. Saved imported source is unchanged.
// @ts-nocheck
import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import * as runtime from "./dist/index.js";

const app = express();
const publicDir = fileURLToPath(new URL("./dist/public/", import.meta.url));
const indexFile = fileURLToPath(new URL("./dist/public/index.html", import.meta.url));
const previewStatic = express.static(publicDir, {
  index: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  },
});

function isVercelPreviewHost(req: any) {
  const host = String(req.hostname || req.headers?.host || "")
    .split(":")[0]
    .toLowerCase();
  return host.endsWith(".vercel.app");
}

app.use((req, res, next) => {
  if (!isVercelPreviewHost(req)) return next();
  return previewStatic(req, res, next);
});

app.use((req, res, next) => {
  if (!isVercelPreviewHost(req) || req.method !== "GET") return next();

  const runtimeOwned =
    req.path === "/api" ||
    req.path.startsWith("/api/") ||
    req.path === "/uploads" ||
    req.path.startsWith("/uploads/") ||
    req.path === "/attached_assets" ||
    req.path.startsWith("/attached_assets/") ||
    req.path === "/objects" ||
    req.path.startsWith("/objects/") ||
    req.path === "/driver-downloads" ||
    req.path.startsWith("/driver-downloads/");

  if (runtimeOwned || !fs.existsSync(indexFile)) return next();

  return res
    .status(200)
    .set({ "Cache-Control": "no-cache, no-store, must-revalidate" })
    .sendFile(indexFile);
});

app.use(runtime.app);

export default app;
