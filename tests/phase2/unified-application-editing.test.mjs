import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("spoken application edits receive explicit targeted generation contracts", async () => {
  const [intent, route] = await Promise.all([
    read("lib/786-chat/edit-intent.ts"),
    read("app/api/786-chat/generate/route.ts"),
  ])
  assert.match(intent, /header-colour/)
  assert.match(intent, /booking-form/)
  assert.match(intent, /database-table/)
  assert.match(intent, /Targeted header edit/)
  assert.match(intent, /real accessible booking form/)
  assert.match(intent, /CREATE TABLE IF NOT EXISTS/)
  assert.match(route, /classifyApplicationEdit/)
  assert.match(route, /applicationEditBrief/)
  assert.match(route, /UNDO_REQUIRES_REVISION_ENDPOINT/)
})

test("booking and database requests become verifiable project requirements", async () => {
  const [specification, architecture, validation] = await Promise.all([
    read("lib/786-chat/specification.ts"),
    read("lib/786-chat/system-architecture.ts"),
    read("lib/786-chat/validation.ts"),
  ])
  assert.match(specification, /submit-booking/)
  assert.match(specification, /databaseTables:/)
  assert.match(architecture, /specification\.databaseTables/)
  assert.match(validation, /Booking route is missing a functional booking form/)
  assert.match(validation, /Missing required database schema: sql\/schema\.sql/)
  assert.match(validation, /Missing requested database table/)
})

test("undo restores the latest different revision atomically and skips safety snapshots", async () => {
  const [revisions, route] = await Promise.all([
    read("lib/786-admin/project-revisions.ts"),
    read("app/api/786-chat/projects/[id]/revisions/undo/route.ts"),
  ])
  assert.match(revisions, /undoLatestProjectChange/)
  assert.match(revisions, /revisionFingerprint/)
  assert.match(revisions, /\["undo-safety", "restore-safety"\]/)
  assert.match(revisions, /revisionFingerprint\(revision\) !== currentFingerprint/)
  assert.match(revisions, /await transaction\(queries\)/)
  assert.match(revisions, /deterministic-revision-undo/)
  assert.match(route, /session\?\.email/)
  assert.match(route, /There is no earlier saved change to undo/)
})

test("Code, Design, revisions and chat share one saved project state", async () => {
  const [workspace, api, projectRoute] = await Promise.all([
    read("components/786-chat/workspace.tsx"),
    read("components/786-chat/api.ts"),
    read("app/api/786-chat/projects/[id]/route.ts"),
  ])
  assert.match(workspace, /isUndoApplicationEdit/)
  assert.match(workspace, /undoLastProjectChange/)
  assert.match(workspace, /saveCodeChanges/)
  assert.match(workspace, /aria-label={`Edit \$\{selectedFile\}`}/)
  assert.match(workspace, /Save &amp; rebuild/)
  assert.match(workspace, /setVisualState\(saved\.visualEditor\)/)
  assert.match(workspace, /setRevisions\(await listBuilderRevisions/)
  assert.match(api, /saveBuilderCodeEdit/)
  assert.match(api, /undoBuilderProject/)
  assert.match(api, /revision_source: "code-editor"/)
  assert.match(projectRoute, /revisionLabel/)
  assert.match(projectRoute, /recordGenerationJob: body\.record_generation_job !== false/)
})
