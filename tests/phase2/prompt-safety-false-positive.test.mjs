import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

const destructiveDataPattern = /\b(?:delete|destroy|wipe|encrypt)\b[^.!?\n]{0,80}\b(?:all databases?|production data|user files|backups?)\b/i

test("destructive-data prompt screening does not cross sentence boundaries", async () => {
  const security = await read("lib/786-chat/security.ts")
  assert.match(security, /\[\^\.\!\?\\n\]\{0,80\}/)

  const benign = "Do not delete existing product records. Preserve all database data."
  assert.equal(destructiveDataPattern.test(benign), false)
})

test("destructive-data prompt screening still blocks direct destructive requests", () => {
  assert.equal(destructiveDataPattern.test("Delete all databases now."), true)
  assert.equal(destructiveDataPattern.test("Wipe production data from the system."), true)
})
