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

test("quoted one-match text edits cannot regenerate the whole existing design", async () => {
  const [api, surgical, projectRoute] = await Promise.all([
    read("components/786-chat/api.ts"),
    read("components/786-chat/surgical-edit.ts"),
    read("app/api/786-chat/projects/[id]/route.ts"),
  ])
  assert.match(api, /trySurgicalTextEdit\(request\)/)
  assert.match(api, /input\.generated\.model !== "surgical-edit"/)
  assert.match(surgical, /totalMatches !== 1/)
  assert.match(surgical, /files\[matchedPath\] = files\[matchedPath\]\.replace/)
  assert.match(surgical, /preserved every other project file/)
  assert.match(projectRoute, /incomingMetadata/)
  assert.match(projectRoute, /\.\.\.\(current\?\.metadata \|\| \{\}\)/)
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

test("undo targets the latest user edit, skips automatic build repair snapshots and queues rebuild", async () => {
  const [route, refresh] = await Promise.all([
    read("app/api/786-chat/projects/[id]/revisions/undo/route.ts"),
    read("lib/786-admin/revision-build-refresh.ts"),
  ])
  assert.match(route, /UNDOABLE_SOURCES/)
  assert.match(route, /"ai-edit"/)
  assert.match(route, /"code-editor"/)
  assert.match(route, /"visual-editor"/)
  assert.doesNotMatch(route, /build-repair/)
  assert.match(route, /source: "undo-safety"/)
  assert.match(route, /restoreProjectRevision/)
  assert.match(route, /queueRevisionRebuild/)
  assert.match(route, /rebuildQueued/)
  assert.match(refresh, /confirm: true/)
  assert.match(refresh, /build\/route/)
})

test("manual restore queues a fresh build so live preview can move to restored source", async () => {
  const route = await read("app/api/786-admin/projects/[id]/revisions/[revisionId]/restore/route.ts")
  assert.match(route, /source: "restore-safety"/)
  assert.match(route, /restoreProjectRevision/)
  assert.match(route, /queueRevisionRebuild/)
  assert.match(route, /rebuildQueued/)
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
