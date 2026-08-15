import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const [route, auth, middleware, adminConfig, adminSession, login] = await Promise.all([
  read("app/api/786-chat/generate/route.ts"),
  read("lib/auth.ts"),
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

test("authenticated generation derives owner policy from verified session", () => {
  assert.match(route, /ownerEmail = session\.email\.toLowerCase\(\)\.trim\(\)/)
  assert.match(route, /userId: session\.id/)
  assert.match(route, /bypassPlanLimits: isAdminUser\(session\.email\)/)
})

test("owner identity is canonical across auth paths", () => {
  assert.match(adminConfig, /replace\(\/\\s\+\/g, ""\)/)
  assert.match(auth, /import \{ ADMIN_EMAIL \} from "@\/lib\/admin-config"/)
  assert.match(middleware, /import \{ ADMIN_EMAIL \} from "@\/lib\/admin-config"/)
  assert.match(adminSession, /email: ADMIN_EMAIL/)
  assert.match(login, /=== ADMIN_EMAIL \? "admin"/)
})

test("auth cookie remains secure and site-wide", () => {
  assert.match(auth, /httpOnly: true/)
  assert.match(auth, /sameSite: "lax"/)
  assert.match(auth, /secure: process\.env\.NODE_ENV === "production"/)
  assert.match(auth, /path: "\/"/)
})