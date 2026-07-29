import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const projectRoutePath = new URL('../../app/api/786-chat/projects/[id]/route.ts', import.meta.url)
const buildRoutePath = new URL('../../app/api/786-chat/projects/[id]/build/route.ts', import.meta.url)
const persistencePath = new URL('../../lib/786-chat/persistence.ts', import.meta.url)

test('canonical project loading and build preview share admin project persistence', async () => {
  const [projectRoute, buildRoute, persistence] = await Promise.all([
    readFile(projectRoutePath, 'utf8'),
    readFile(buildRoutePath, 'utf8'),
    readFile(persistencePath, 'utf8'),
  ])

  assert.match(persistence, /INSERT INTO admin_projects/)
  assert.match(persistence, /admin_project_files/)
  assert.match(projectRoute, /getProjectWithData/)
  assert.match(buildRoute, /786-admin\/projects\/\[id\]\/build/)
  assert.doesNotMatch(projectRoute, /FROM projects/)
})
