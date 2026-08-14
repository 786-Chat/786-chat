import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const security = await readFile(new URL("../../lib/786-chat/security.ts", import.meta.url), "utf8")

test("prompt safety does not broadly join disable-member text to later authorization text", () => {
  assert.doesNotMatch(security, /\(\?:disable\|bypass\|evade\)/)
  assert.match(security, /\(\?:bypass\|evade\)/)
  assert.match(security, /disable\\s\+\(\?:the\\s\+\)\?/)
})
