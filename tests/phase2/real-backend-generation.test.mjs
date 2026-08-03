import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("project prompts detect real backend capabilities", async () => {
  const specification = await read("lib/786-chat/specification.ts")
  assert.match(specification, /"file-storage"/)
  assert.match(specification, /log\[ -\]\?in/)
  assert.match(specification, /upload\|attachment/)
})

test("generation requires production provider files instead of mock backends", async () => {
  const [capabilities, route, planner] = await Promise.all([
    read("lib/786-chat/backend-capabilities.ts"),
    read("app/api/786-chat/generate/route.ts"),
    read("lib/786-chat/planner.ts"),
  ])
  for (const value of [
    "backend/manifest.json",
    "lib/server/db.ts",
    "sql/migrations/001_initial.sql",
    "scripts/migrate.mjs",
    "lib/server/auth.ts",
    "app/api/uploads/route.ts",
    "lib/server/email.ts",
  ]) {
    assert.ok(capabilities.includes(value), `missing ${value}`)
  }
  assert.match(capabilities, /@neondatabase\/serverless/)
  assert.match(capabilities, /@vercel\/blob/)
  assert.match(capabilities, /\bResend\b/)
  assert.match(capabilities, /bcryptjs/)
  assert.match(capabilities, /\bjose\b/)
  assert.match(route, /backendCapabilityBrief\(specification\)/)
  assert.match(route, /requiredBackendFiles\(specification\)/)
  assert.match(planner, /requiredBackendFiles\(specification\)/)
})

test("backend acceptance enforces isolation, secrets and provider safety", async () => {
  const [capabilities, validation] = await Promise.all([
    read("lib/786-chat/backend-capabilities.ts"),
    read("lib/786-chat/validation.ts"),
  ])
  assert.match(validation, /assessGeneratedBackend\(specification, files\)/)
  assert.match(capabilities, /NEXT_PUBLIC_\(\?:DATABASE\|NEON\|AUTH\|BLOB\|RESEND\|EMAIL\)/)
  assert.match(capabilities, /HttpOnly|httpOnly/)
  assert.match(capabilities, /SameSite|sameSite/)
  assert.match(capabilities, /AUTH_SECRET/)
  assert.match(capabilities, /Missing backend dependency/)
  assert.match(capabilities, /API resource .* must authenticate and enforce ownership/)
  assert.match(capabilities, /Email API must validate input and enforce authentication or persistent abuse protection/)
})
