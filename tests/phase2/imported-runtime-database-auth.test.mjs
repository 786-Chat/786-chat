import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const finalizer = await readFile(
  new URL("../../lib/786-admin/imported-runtime-finalizer.ts", import.meta.url),
  "utf8",
)

test("imported server database clients receive generated runtime provisioning markers", () => {
  assert.match(finalizer, /ensureImportedDatabaseRuntime/)
  assert.match(finalizer, /server\/db\.ts/)
  assert.match(finalizer, /DATABASE_URL\|@neondatabase\\\/serverless\|drizzle-orm/)
  assert.match(finalizer, /lib\/server\/db\.ts/)
  assert.match(finalizer, /sql\/migrations\/001_initial\.sql/)
  assert.match(finalizer, /SELECT 1;/)
})

test("Replit auth imports do not crash Vercel when Replit OIDC variables are absent", () => {
  assert.match(finalizer, /hardenImportedReplitAuth/)
  assert.match(finalizer, /!process\.env\.REPLIT_DOMAINS && !process\.env\.VERCEL/)
  assert.match(finalizer, /createTableIfMissing: Boolean\(process\.env\.VERCEL\)/)
  assert.match(finalizer, /process\.env\.SESSION_SECRET \|\| process\.env\.AUTH_SECRET/)
  assert.match(finalizer, /process\.env\.VERCEL && \(!process\.env\.REPLIT_DOMAINS \|\| !process\.env\.REPL_ID\)/)
  assert.match(finalizer, /passport\.serializeUser/)
  assert.match(finalizer, /passport\.deserializeUser/)
})
