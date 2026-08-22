import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const backendCapabilitiesPath = new URL("../../lib/786-chat/backend-capabilities.ts", import.meta.url)
const sameSitePattern = /sameSite\s*:[^,\n}]*(?:["'](?:lax|strict)["'])/

test("auth cookie validation accepts preview conditional with production-safe SameSite", async () => {
  const source = await readFile(backendCapabilitiesPath, "utf8")
  assert.match(source, /sameSite\\s\*:\[\^,\\n}\]\*/)

  assert.equal(sameSitePattern.test("sameSite: 'lax',"), true)
  assert.equal(sameSitePattern.test("sameSite: 'strict',"), true)
  assert.equal(sameSitePattern.test("sameSite: embeddedPreview ? 'none' : 'lax',"), true)
  assert.equal(sameSitePattern.test("sameSite: 'none',"), false)
})
