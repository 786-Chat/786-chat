import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const compatibilitySource = fs.readFileSync(
  new URL("../../lib/786-chat/neon-compatibility.ts", import.meta.url),
  "utf8",
)
const buildRouteSource = fs.readFileSync(
  new URL("../../app/api/786-admin/projects/[id]/build/route.ts", import.meta.url),
  "utf8",
)

test("generated build compatibility repairs both persisted Pest routes escaped newlines", () => {
  assert.match(compatibilitySource, /export function normalizeKnownGeneratedSyntaxArtifacts/)
  assert.match(compatibilitySource, /Syntax error \\"n\\"/)
  assert.ok(
    compatibilitySource.includes(
      'await storage.markUsefulLinkAsSent(newLink.id);\\\\n      const deliveredLink =',
    ),
  )
  assert.ok(
    compatibilitySource.includes(
      'await storage.getUsefulLink(newLink.id);\\\\n      res.json({ success: true, data: deliveredLink || newLink, message: "Link sent to branch successfully" });',
    ),
  )
})

test("imported builds persist syntax repairs before validation and dispatch", () => {
  assert.ok(buildRouteSource.includes("normalizeKnownGeneratedSyntaxArtifacts"))
  assert.ok(
    buildRouteSource.includes("normalizeImportedSyntaxArtifacts(id, project.files || {})"),
  )
  assert.ok(
    buildRouteSource.includes("Project not found after syntax artifact repair"),
  )

  const syntaxRepair = buildRouteSource.indexOf(
    "normalizeImportedSyntaxArtifacts(id, project.files || {})",
  )
  const compatibilityGuard = buildRouteSource.indexOf(
    "if (body.confirm === true && !buildOptions.imported)",
    syntaxRepair,
  )
  assert.ok(syntaxRepair >= 0)
  assert.ok(compatibilityGuard > syntaxRepair)
})
