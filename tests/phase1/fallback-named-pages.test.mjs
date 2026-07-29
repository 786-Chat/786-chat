import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const source = await readFile(new URL("../../app/api/786-admin/chat-compact/route.ts", import.meta.url), "utf8")

assert.match(source, /function fallbackPromptWithRoutes\(/, "compact fallback must normalise named page lists")
assert.match(source, /FALLBACK ROUTES — CREATE REAL PAGE FILES/, "normalised routes must be appended as explicit paths")
assert.match(source, /create these pages\|pages\|routes/, "page-list headings must be recognised")
assert.match(source, /slugify\(bullet\)/, "named pages must become route-safe slugs")
assert.match(source, /routes\.add\("\/"\)/, "the Home route must always be generated")
assert.match(source, /createPremiumFallbackProject\(fallbackPromptWithRoutes\(message\)\)/, "the fallback generator must receive normalised routes")

console.log("fallback named-page route regression checks passed")
