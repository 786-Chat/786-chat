import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const compatibilitySource = fs.readFileSync(
  new URL("../../lib/786-chat/neon-compatibility.ts", import.meta.url),
  "utf8",
)

test("generated build compatibility repairs the persisted Pest routes escaped newline", () => {
  assert.match(compatibilitySource, /function normalizeEscapedStatementNewlines/)
  assert.match(compatibilitySource, /server\\\/routes/)
  assert.match(compatibilitySource, /Syntax error \\"n\\"/)
  assert.match(compatibilitySource, /normalizedFiles = normalizeEscapedStatementNewlines\(files\)/)
  assert.ok(
    compatibilitySource.includes(
      'const broken = "await storage.markUsefulLinkAsSent(newLink.id);\\\\n      const deliveredLink ="',
    ),
  )
  assert.ok(
    compatibilitySource.includes(
      'content.replaceAll(broken, fixed)',
    ),
  )
})

test("repair is deliberately scoped to server routes", () => {
  assert.ok(
    compatibilitySource.includes('if (!/(?:^|\\/)server\\/routes\\.(?:ts|js)$/.test(path))'),
  )
})
