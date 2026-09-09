import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("revision history lists lightweight metadata instead of full project snapshots", async () => {
  const [route, revisions] = await Promise.all([
    read("app/api/786-admin/projects/[id]/revisions/route.ts"),
    read("lib/786-admin/project-revisions.ts"),
  ])

  assert.match(route, /listProjectRevisionSummaries/)
  assert.match(revisions, /export type AdminProjectRevisionSummary/)
  const summaryFunction = revisions.match(/export async function listProjectRevisionSummaries[\s\S]*?\n}\n/)?.[0] || ""
  assert.match(summaryFunction, /SELECT id, project_id, owner_email, label, source, created_at/)
  assert.doesNotMatch(summaryFunction, /\bfiles\b|preview_state|metadata/)
})

test("checkpoint creation returns metadata only after storing the full snapshot", async () => {
  const revisions = await read("lib/786-admin/project-revisions.ts")
  const createFunction = revisions.match(/export async function createProjectRevision[\s\S]*?\n}\n/)?.[0] || ""

  assert.match(createFunction, /Promise<AdminProjectRevisionSummary>/)
  assert.match(createFunction, /files, preview_state, metadata/)
  assert.match(createFunction, /RETURNING id, project_id, owner_email, label, source, created_at/)
  assert.doesNotMatch(createFunction, /RETURNING \*/)
})

test("undo finds a lightweight revision first and restores only the selected snapshot", async () => {
  const undoRoute = await read("app/api/786-chat/projects/[id]/revisions/undo/route.ts")

  assert.match(undoRoute, /listProjectRevisionSummaries/)
  assert.doesNotMatch(undoRoute, /listProjectRevisions/)
  assert.match(undoRoute, /restoreProjectRevision/)
  assert.match(undoRoute, /restoredRevision:\s*\{/)
})
