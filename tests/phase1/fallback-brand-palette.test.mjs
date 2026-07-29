import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = await readFile(new URL("../../lib/786-admin/premium-fallback-generator.ts", import.meta.url), "utf8")

test("fallback never uses generic 786 artwork", () => {
  assert.doesNotMatch(source, /visualWord[^\n]*["'`]786["'`]/)
  assert.match(source, /general:\s*"WELCOME"/)
  assert.match(source, /technology:\s*"CREATE"/)
})

test("fallback recognises legal projects and requested legal palette", () => {
  assert.match(source, /type Industry[^\n]*"legal"/)
  assert.match(source, /law firm\|legal\|solicitor\|lawyer/)
  assert.match(source, /legal:\s*\{ eyebrow: "Clear advice\. Confident decisions\."/)
  assert.match(source, /deep navy/)
  assert.match(source, /ivory/)
  assert.match(source, /bronze/)
  assert.match(source, /NAVY_IVORY_BRONZE/)
})

test("fallback visual uses neutral industry-specific geometry", () => {
  assert.match(source, /aria-hidden="true"/)
  assert.match(source, /className="line one"/)
  assert.doesNotMatch(source, /className="orb one"/)
})
