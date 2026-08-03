import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const read = (path) => readFileSync(path, "utf8")

test("authentication requires a configured strong JWT secret", () => {
  const auth = read("lib/auth.ts")
  assert.doesNotMatch(auth, /fallback-secret|your-super-secret/)
  assert.match(auth, /JWT_SECRET/)
  assert.match(auth, /sessionVersion/)
})

test("account schema supports verification, reset tokens and session revocation", () => {
  const migration = read("lib/786-admin/migrations/005-account-security.sql")
  assert.match(migration, /email_verified/)
  assert.match(migration, /password_reset/)
  assert.match(migration, /session_version/)
})

test("registration requires email verification before a session is created", () => {
  const register = read("app/api/auth/register/route.ts")
  const login = read("app/api/auth/login/route.ts")
  assert.match(register, /verificationRequired/)
  assert.doesNotMatch(register, /setAuthCookie/)
  assert.match(login, /EMAIL_NOT_VERIFIED/)
})

test("transactional email uses the configured provider", () => {
  assert.match(read("lib/transactional-email.ts"), /RESEND_API_KEY/)
})

test("builder APIs are tenant scoped instead of owner-only", () => {
  for (const path of [
    "app/api/786-chat/projects/route.ts",
    "app/api/786-chat/projects/[id]/route.ts",
    "app/api/786-chat/generate/route.ts",
    "app/api/786-chat/projects/[id]/deploy/route.ts",
  ]) {
    assert.doesNotMatch(read(path), /isAdminUser/)
  }
  assert.match(read("middleware.ts"), /isBuilderPage/)
})
