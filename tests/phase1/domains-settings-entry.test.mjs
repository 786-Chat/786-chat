import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("Domains is opened from Settings instead of a floating builder button", async () => {
  const manager = await read("components/786-chat/project-domain-manager.tsx")

  assert.match(manager, /utility-panel-title/)
  assert.match(manager, /title\?\.textContent\?\.trim\(\) !== "Settings"/)
  assert.match(manager, /createPortal/)
  assert.match(manager, />Domains</)
  assert.match(manager, /Manage 786\.Chat subdomains, custom domains, DNS, SSL and the primary address/)
  assert.doesNotMatch(manager, /fixed bottom-20 right-4/)
})

test("moving the Domains entry does not remove domain management actions", async () => {
  const manager = await read("components/786-chat/project-domain-manager.tsx")

  assert.match(manager, /refresh-domain/)
  assert.match(manager, /set-primary-domain/)
  assert.match(manager, /remove-domain/)
  assert.match(manager, /Make primary/)
  assert.match(manager, /Refresh/)
  assert.match(manager, /Remove/)
})
