import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const planner = await readFile(new URL("../../lib/786-chat/planner.ts", import.meta.url), "utf8")

test("authentication plan explicitly requires bcryptjs and jose", () => {
  assert.match(planner, /lib\/server\/auth\.ts/)
  assert.match(planner, /bcryptjs/)
  assert.match(planner, /jose/)
  assert.match(planner, /AUTH_SECRET/)
  assert.match(planner, /signs\/verifies sessions/)
})

test("shared auth helper API is explicit and consistent", () => {
  for (const helper of ["hashPassword", "verifyPassword", "signSession", "verifySession", "generateToken", "hashToken"]) {
    assert.match(planner, new RegExp(helper))
  }
  assert.match(planner, /Forgot-password API using exported generateToken and hashToken/)
  assert.match(planner, /Reset-password API using exported hashToken and hashPassword/)
  assert.match(planner, /every app\/api\/auth route imports only helpers actually exported/)
})

test("auth routes are planned against shared crypto helpers", () => {
  assert.match(planner, /Registration API using exported hashPassword/)
  assert.match(planner, /Login API using exported verifyPassword and signSession/)
  assert.match(planner, /Session API using exported verifySession/)
})
