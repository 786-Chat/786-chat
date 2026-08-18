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

test("one validation message can promote every missing route instead of only the first", () => {
  assert.match(route, /matchAll\(matcher\)/)
  assert.match(route, /const matcher = \/\(\?:Internal navigation points to missing route\|Missing requested route\)/)
  assert.doesNotMatch(route, /const match = error\.match\(/)

  const example = "Internal navigation points to missing route: /customers; Internal navigation points to missing route: /reservations; Internal navigation points to missing route: /orders; Internal navigation points to missing route: /customers/new"
  const matcher = /(?:Internal navigation points to missing route|Missing requested route):\s*(\/[^;\s]*)/gi
  assert.deepEqual(
    [...example.matchAll(matcher)].map((match) => match[1]),
    ["/customers", "/reservations", "/orders", "/customers/new"],
  )
})
