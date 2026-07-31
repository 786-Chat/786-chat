import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8")
}

test("preview storage guard never restores same-origin access", async () => {
  const file = await source("components/786-admin/admin-chat-preview-storage-guard.tsx")
  assert.match(file, /permission\) => permission !== "allow-same-origin"/)
  assert.doesNotMatch(file, /\[\.\.\.current,\s*"allow-same-origin"\]/)
})

test("projects page keeps preview iframes origin-isolated", async () => {
  const file = await source("app/786-admin/projects/page.tsx")
  assert.doesNotMatch(file, /allow-same-origin/)
})

test("project deletion does not use a blocking browser confirmation", async () => {
  const file = await source("app/786-admin/projects/page.tsx")
  assert.doesNotMatch(file, /window\.confirm\s*\(/)
})

test("canonical workspace uses explicit confirmation for project deletion", async () => {
  const [workspace, route, schema] = await Promise.all([
    source("components/786-chat/workspace.tsx"),
    source("app/api/786-chat/projects/[id]/route.ts"),
    source("lib/786-admin/schema.sql"),
  ])
  assert.match(workspace, /Delete permanently/)
  assert.match(workspace, /deleteBuilderProject/)
  assert.doesNotMatch(workspace, /window\.confirm\s*\(/)
  assert.match(route, /export async function DELETE/)
  assert.match(route, /deleteProject\(id, owner\)/)
  assert.match(schema, /REFERENCES admin_projects\(id\) ON DELETE CASCADE/)
})

test("recent project cards are not injected into the customer preview workspace", async () => {
  const file = await source("app/786-admin/chat/layout.tsx")
  assert.doesNotMatch(file, /AdminChatRecentProjects/)
})

test("canonical generation rejects local fallback projects", async () => {
  const file = await source("app/api/786-chat/generate/route.ts")
  assert.match(file, /fellBackToLocal === true/)
  assert.match(file, /No generic fallback project was accepted or saved/)
  assert.match(file, /status:\s*503/)
})
