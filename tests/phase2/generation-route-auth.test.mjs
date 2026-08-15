import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const [route, auth, client, middleware, adminConfig, adminSession, login] = await Promise.all([
  read("app/api/786-chat/generate/route.ts"),
  read("lib/auth.ts"),
  read("components/786-chat/api.ts"),
  read("middleware.ts"),
  read("lib/admin-config.ts"),
  read("app/api/786-admin/session/route.ts"),
  read("app/api/auth/login/route.ts"),
])

test("unauthenticated generation remains a server-side 401", () => {
  assert.match(route, /const session = await getSession\(\)/)
  assert.match(route, /if \(!session\?\.email\)/)
  assert.match(route, /status: 401/)
  assert.doesNotMatch(route, /payload\.(?:owner|admin|isOwner)/)
})

test("authenticated generation uses the verified session for user and owner policy", () => {
  assert.match(route, /ownerEmail = session\.email\.toLowerCase\(\)\.trim\(\)/)
  assert.match(route, /userId: session\.id/)
  assert.match(route, /bypassPlanLimits: isAdminUser\(session\.email\)/)
  assert.match(auth, /getAccountSessionState\(payload\.id\)/)
})

test("owner identity is canonical across token issuance, middleware, and route auth", () => {
  assert.match(adminConfig, /replace\(\/\\s\+\/g, ""\)/)
  assert.match(auth, /import \{ ADMIN_EMAIL \} from "@\/lib\/admin-config"/)
  assert.match(middleware, /import \{ ADMIN_EMAIL \} from "@\/lib\/admin-config"/)
  assert.match(adminSession, /email !== ADMIN_EMAIL/)
  assert.match(adminSession, /email: ADMIN_EMAIL/)
  assert.match(login, /=== ADMIN_EMAIL \? "admin"/)
})

test("browser generation uses a same-origin URL so fetch sends its session cookie", () => {
  assert.match(client, /fetch\("\/api\/786-chat\/generate"/)
  assert.doesNotMatch(client, /credentials: "omit"/)
})

test("no public or client-spoofed owner bypass is introduced", () => {
  assert.doesNotMatch(route, /request\.headers\.get\([^)]*owner|payload\.(?:owner|admin|isOwner)/)
  assert.match(auth, /httpOnly: true/)
  assert.match(auth, /sameSite: "lax"/)
  assert.match(auth, /secure: process\.env\.NODE_ENV === "production"/)
})
