import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("API endpoints are not treated as browser page routes", async () => {
  const specification = await read("lib/786-chat/specification.ts")
  assert.match(specification, /requestedPageRoutes = requestedRoutes\.filter\(\(route\) => !route\.startsWith\("\/api\/"\)\)/)
  assert.match(specification, /explicitDatabaseTables\(prompt\)/)
  assert.match(specification, /\.\.\.explicitTables/)
})

test("backend resources come from explicit database tables", async () => {
  const backend = await read("lib/786-chat/backend-capabilities.ts")
  assert.match(backend, /\.\.\.\(specification\.databaseTables \|\| \[\]\)/)
  assert.match(backend, /mandatory backend files take priority/i)
})

test("public CRUD is allowed when authentication is explicitly not requested", async () => {
  const backend = await read("lib/786-chat/backend-capabilities.ts")
  assert.match(backend, /const requiresAuthentication = capabilities\.includes\("authentication"\)/)
  assert.match(backend, /if \(requiresAuthentication && \(!hasGuard\(collection\) \|\| !hasGuard\(item\)\)\)/)
  assert.match(backend, /Do not invent an auth dependency/)
})
