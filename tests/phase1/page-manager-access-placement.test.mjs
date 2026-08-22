import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const bridgePath = new URL("../../components/786-chat/page-manager-access-bridge.tsx", import.meta.url)
const builderPagePath = new URL("../../app/786.chat/page.tsx", import.meta.url)

test("top Pages shortcut is hidden and page manager remains available from Design", async () => {
  const bridge = await readFile(bridgePath, "utf8")
  const builderPage = await readFile(builderPagePath, "utf8")

  assert.match(bridge, /Open pages manager/)
  assert.match(bridge, /display:none !important/)
  assert.match(bridge, /Close visual editor/)
  assert.match(bridge, /Pages &amp; navigation/)
  assert.match(bridge, /Move, hide, show or remove optional pages/)
  assert.match(builderPage, /BuilderPageManagerAccessBridge/)
})
