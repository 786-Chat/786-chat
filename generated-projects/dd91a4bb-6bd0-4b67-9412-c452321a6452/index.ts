// 786.Chat runtime-only Vercel Express bridge. Saved imported source is unchanged.
// @ts-nocheck
import express from "express"
import fs from "fs"
import { fileURLToPath } from "url"
// Load the build artifact so Vercel traces the generated server and its sibling Vite assets.
import runtime from "./dist/index.cjs"

const bridge = express()
const publicDir = fileURLToPath(new URL("./dist/public/", import.meta.url))
const indexPath = fileURLToPath(new URL("./dist/public/index.html", import.meta.url))

const RESTAURANT_SECRET_FIELDS = new Set([
  "loginPassword",
  "kitchenLoginPassword",
  "eposLoginPassword",
  "waiterLoginPassword",
  "suppliersLoginPassword",
  "financesLoginPassword",
  "stripeSecretKey",
  "sumupApiKey",
  "squareAccessToken",
  "zettleApiKey",
])

function redactRestaurantSecrets(value: any): any {
  if (Array.isArray(value)) return value.map(redactRestaurantSecrets)
  if (!value || typeof value !== "object") return value

  const clean: Record<string, any> = {}
  for (const [key, nested] of Object.entries(value)) {
    if (RESTAURANT_SECRET_FIELDS.has(key)) continue
    clean[key] = redactRestaurantSecrets(nested)
  }
  return clean
}

// Never expose branch login credentials or private payment-provider keys through the
// unauthenticated restaurant read APIs. This only redacts response fields; stored data
// and all login/update flows remain unchanged.
bridge.use((req, res, next) => {
  if (req.method !== "GET" || !req.path.startsWith("/api/restaurants")) return next()

  const originalJson = res.json.bind(res)
  res.json = function patchedJson(body: any) {
    return originalJson(redactRestaurantSecrets(body))
  } as any

  next()
})

// Vercel can receive a request while the imported Express app is still finishing its
// asynchronous startup. The imported app intentionally returns a tiny "Loading..."
// document until appReady is true, but on a serverless cold start that response can
// freeze the invocation before startup finishes. It also used to catch /assets/* and
// return HTML for JavaScript chunks, causing dynamic-import failures (for example
// howler-*.js). Serve immutable build assets ahead of the imported app so a cold start
// can never turn a JavaScript/CSS request into the bootstrap HTML page.
if (fs.existsSync(publicDir)) {
  bridge.use(express.static(publicDir, {
    index: false,
    fallthrough: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
      }
    },
  }))
}

// Keep all API, object-storage and upload requests on the original imported runtime.
// For browser page requests only, replace the cold-start bootstrap response with the
// already-built SPA shell. Once the imported runtime is fully initialized, its normal
// routing/branch-branding response passes through unchanged.
bridge.use((req, res, next) => {
  if (req.method !== "GET") return next()
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/objects/") ||
    req.path.startsWith("/uploads/") ||
    req.path.startsWith("/attached_assets/") ||
    req.path.startsWith("/driver-downloads/")
  ) {
    return next()
  }

  const originalSend = res.send.bind(res)
  res.send = function patchedSend(body: any) {
    if (
      typeof body === "string" &&
      body.includes("<p>Loading...</p>") &&
      fs.existsSync(indexPath)
    ) {
      const html = fs.readFileSync(indexPath, "utf-8")
      res.setHeader("Content-Type", "text/html; charset=utf-8")
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
      return originalSend(html)
    }
    return originalSend(body)
  } as any

  next()
})

bridge.use(runtime.app)

export default bridge
