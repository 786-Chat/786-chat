// 786.Chat runtime-only Vercel Express bridge. Saved imported source is unchanged.
// @ts-nocheck
import express from "express"
// Load the build artifact so Vercel traces the generated server and its sibling Vite assets.
import runtime from "./dist/index.cjs"
void express

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function hasProductionSyncRoute() {
  const app: any = runtime.app
  const stack = app?._router?.stack || app?.router?.stack || []
  return stack.some((layer: any) => layer?.route?.path === "/api/sync-production" && layer?.route?.methods?.post)
}

export default async function handler(req: any, res: any) {
  const pathname = String(req.url || "").split("?")[0]

  // Temporary one-time maintenance bridge used to restore the imported FoodSafety
  // embedded production data. This is removed immediately after the restore.
  if (pathname === "/__786_foodsafety_restore_embedded_once") {
    for (let attempt = 0; attempt < 80 && !hasProductionSyncRoute(); attempt += 1) {
      await sleep(250)
    }

    if (!hasProductionSyncRoute()) {
      return res.status(503).json({ error: "FoodSafety production sync route is not ready" })
    }

    req.method = "POST"
    req.url = "/api/sync-production"
    return runtime.app(req, res)
  }

  return runtime.app(req, res)
}
