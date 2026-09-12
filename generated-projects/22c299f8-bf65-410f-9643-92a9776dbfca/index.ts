// 786.Chat runtime-only Vercel Express bridge. Saved imported source is unchanged.
// @ts-nocheck
import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

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
    req.path === "/__786-runtime-health" ||
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

const importedRuntimeAssets = {
  "server/templates/inspection_report_template.pdf": "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087854565-59ba01ac-2bd0-458a-8e42-16b2199498c6-inspection_report_template-FYQqq7vHh6jqrIkRzenLp0qiG6Su3A.pdf",
  "server/templates/coshh_template.pdf": "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087856708-053a457f-1614-4fb6-8319-38453bc55103-coshh_template-U8BduclivOShrKJLtLULzvho2oZJXI.pdf",
  "server/templates/fonts/caveat.woff2": "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087857963-fd67c457-bb80-402a-b7bf-24b83086e3bf-caveat-DZXBflUtXS6I32iZbydicI2LLPTNV9.woff2",
  "server/templates/fonts/Caveat.ttf": "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087858525-97920d4c-976f-4e3d-910d-dbd3fe26c012-Caveat-xMzm1THLOzurizJADIvasaqN6dVaIU.ttf",
  "server/templates/fonts/Caveat-Regular.ttf": "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087859437-8ea0424e-fb93-4615-b091-875a71155e5b-Caveat-Regular-pEFS1TBEhaz2jnZ47UNVdbLWz3BUzj.ttf",
  "server/templates/fonts/Kalam-Regular.ttf": "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087860204-c87fa59d-13a3-41b8-a3f2-522122d53d8a-Kalam-Regular-LukcfRdlAy8IO3gjnzdepDQUVnNHbP.ttf",
  "server/templates/fonts/IndieFlower-Regular.ttf": "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087861004-da892359-84f3-43c3-ad1f-5bc0cd17c075-IndieFlower-Regular-NDcu7X3PIO6t3zFiNKjaSuEobJuQ7I.ttf",
  "server/templates/fonts/PatrickHand-Regular.ttf": "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087861666-5184940d-5323-489d-9cea-1f33ba8677a8-PatrickHand-Regular-WrkAXnvhXM5iBuTVA4d5PRBiqm2kgP.ttf",
  "server/templates/fonts/BiroScript.ttf": "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087862433-bf8cc14d-38e6-4a7a-8616-047006ecc1c9-BiroScript-MJ4XYfcTmDU10wrQAmGabIo3IVnVhz.ttf"
};
let importedRuntimePromise: Promise<any> | null = null;

async function loadImportedRuntime() {
  if (!importedRuntimePromise) {
    importedRuntimePromise = (async () => {
      const runtimeRoot = process.env.TMPDIR || "/tmp";
      if (process.env.VERCEL) process.env.NODE_ENV = "production";
      process.chdir(runtimeRoot);
      await Promise.all(Object.entries(importedRuntimeAssets).map(async ([relativePath, url]) => {
        const destination = path.join(runtimeRoot, relativePath);
        await fs.promises.mkdir(path.dirname(destination), { recursive: true });
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Imported runtime asset fetch failed: ${relativePath} (${response.status})`);
        await fs.promises.writeFile(destination, Buffer.from(await response.arrayBuffer()));
      }));
      const runtime = await import("./dist/index.js");
      const runtimeApp = runtime.app ?? runtime.default?.app ?? runtime.default;
      if (!runtimeApp) {
        throw new Error("Imported Express runtime did not export an app");
      }
      return runtimeApp;
    })();
  }
  return importedRuntimePromise;
}

app.get("/__786-runtime-health", async (_req, res, next) => {
  try {
    await loadImportedRuntime();
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.use(async (req, res, next) => {
  try {
    const runtimeApp = await loadImportedRuntime();
    return runtimeApp(req, res, next);
  } catch (error) {
    return next(error);
  }
});

export default app;
