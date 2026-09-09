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
