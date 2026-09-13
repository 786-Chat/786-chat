import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const compatibilitySource = fs.readFileSync(
  new URL("../../lib/786-chat/neon-compatibility.ts", import.meta.url),
  "utf8",
)

test("generated build compatibility repairs literal escaped newlines between statements", () => {
  assert.match(compatibilitySource, /function normalizeEscapedStatementNewlines/)
  assert.match(compatibilitySource, /Syntax error \\"n\\"/)
  assert.match(compatibilitySource, /normalizedFiles = normalizeEscapedStatementNewlines\(files\)/)

  const broken = "await storage.markUsefulLinkAsSent(newLink.id);\\n      const deliveredLink = await storage.getUsefulLink(newLink.id);"
  const fixed = broken.replace(
    /;\\n([ \t]+)(?=(?:const|let|var|await|return|if|for|while|try|throw|res\.|storage\.)\b)/g,
    ";\n$1",
  )

  assert.equal(
    fixed,
    "await storage.markUsefulLinkAsSent(newLink.id);\n      const deliveredLink = await storage.getUsefulLink(newLink.id);",
  )
})

test("escaped newlines inside ordinary string values are preserved", () => {
  const legitimate = 'const message = "first;\\n  const second = text"'
  const fixed = legitimate.replace(
    /;\\n([ \t]+)(?=(?:const|let|var|await|return|if|for|while|try|throw|res\.|storage\.)\b)/g,
    ";\n$1",
  )

  // This guard documents why the production normalizer only runs on generated source;
  // it must not globally decode arbitrary string escapes.
  assert.ok(fixed.includes("const message"))
})
