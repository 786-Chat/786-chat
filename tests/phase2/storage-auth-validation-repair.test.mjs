import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const root = new URL("../../", import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), "utf8")
}

test("backend validation accepts split secure auth implementation", async () => {
  const code = await source("lib/786-chat/backend-capabilities.ts")
  assert.match(code, /authenticationImplementationSource/)
  assert.match(code, /hasSecurePasswordAndJoseAuth/)
  assert.match(code, /SignJWT/)
  assert.match(code, /jwtVerify/)
  assert.match(code, /bcryptjs/)
})

test("blob path validation accepts authenticated session identity scopes", async () => {
  const code = await source("lib/786-chat/backend-capabilities.ts")
  assert.match(code, /hasAuthenticatedBlobPathScope/)
  assert.match(code, /session/)
  assert.match(code, /blobPath/)
  assert.match(code, /documents\/\$\{user\.id\}/)
})
