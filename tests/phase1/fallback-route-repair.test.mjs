import assert from "node:assert/strict"
import fs from "node:fs"

const helper = fs.readFileSync("lib/786-admin/fallback-route-normalizer.ts", "utf8")
const compact = fs.readFileSync("app/api/786-admin/chat-compact/route.ts", "utf8")

assert.match(helper, /requestedFallbackRoutes/)
assert.match(helper, /repairFallbackRouteFiles/)
assert.match(helper, /app\/\$\{route\.replace/)
assert.match(helper, /<nav>\$\{navigation\}<\/nav>/)
assert.match(compact, /repairFallbackRouteFiles\(local\.files, message\)/)
assert.match(compact, /complete \$\{Object\.keys\(files\)/)

console.log("fallback route repair regression checks passed")
