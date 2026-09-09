// 786.Chat runtime-only Vercel Express bridge. Saved imported source is unchanged.
// @ts-nocheck
import express from "express"
// Load the build artifact so Vercel traces the generated server and its sibling Vite assets.
import runtime from "./dist/index.cjs"
void express
export default runtime.app
