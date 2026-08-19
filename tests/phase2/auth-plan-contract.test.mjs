import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const planner = await readFile(new URL("../../lib/786-chat/planner.ts", import.meta.url), "utf8")

test("authentication plan explicitly requires bcryptjs and jose", () => {
  assert.match(planner, /lib\/server\/auth\.ts/)
  assert.match(planner, /bcryptjs hash\/compare/)
  assert.match(planner, /jose SignJWT\/jwtVerify/)
  assert.match(planner, /AUTH_SECRET/)
  assert.match(planner, /signs\/verifies sessions/)
})

test("auth routes are planned against shared crypto helpers", () => {
  assert.match(planner, /Registration API that validates input, hashes passwords through lib\/server\/auth\.ts/)
  assert.match(planner, /Login API that validates input, compares bcrypt password hashes/)
  assert.match(planner, /Reset-password API that validates the one-time token, hashes the new password with bcryptjs/)
})
