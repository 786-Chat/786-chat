import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const route = await readFile(new URL("../../app/api/786-chat/generate/route.ts", import.meta.url), "utf8")

test("validator-discovered missing routes are promoted into repair file targets", () => {
  assert.match(route, /function routeRepairFilesFromValidationErrors/)
  assert.match(route, /Internal navigation points to missing route/)
  assert.match(route, /Missing requested route/)
  assert.match(route, /\.\.\.routeRepairFilesFromValidationErrors\(validation\.errors\)/)
})

test("repair route extraction maps safe internal routes to Next.js page files", () => {
  assert.match(route, /route === "\/" \? "app\/page\.tsx" : `app\/\$\{route\.slice\(1\)\}\/page\.tsx`/)
  assert.match(route, /if \(!\/\^\\\//)
  assert.match(route, /\.test\(route\)\) continue/)
})
