// 786.Chat/Vercel Node entrypoint for the imported Express application.
// Load the already bundled server output so Vercel does not try to resolve the
// original extensionless TypeScript imports at runtime.
import express from "express"
import { createRequire } from "module"

const require = createRequire(import.meta.url)
const runtime = require("./dist/index.cjs") as { app?: ReturnType<typeof express> }

void express

if (!runtime.app) {
  throw new Error("FoodSafetyMenu runtime bundle did not export the Express app")
}

export default runtime.app
