// 786.Chat runtime-only Vercel Express bridge. Saved imported source is unchanged.
// @ts-nocheck
import express from "express"
// Use an explicit .js extension because Vercel emits this bridge as ESM index.js.
// TypeScript/Vercel resolves this to server/index.ts during packaging and Node can resolve server/index.js at runtime.
import { app } from "./server/index.js"
void express
export default app
