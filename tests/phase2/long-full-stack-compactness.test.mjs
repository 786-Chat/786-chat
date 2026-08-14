import assert from "node:assert/strict"
import fs from "node:fs"
const source = fs.readFileSync("lib/786-chat/provider-controller.ts", "utf8")
assert.match(source, /ULTRA-COMPACT FULL-STACK OUTPUT/)
assert.match(source, /COMPLEX_DEEPSEEK_TIMEOUT_MS = 175_000/)
console.log("long full-stack compactness rules present")
