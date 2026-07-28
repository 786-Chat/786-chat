import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routePath = new URL('../../app/api/projects/[id]/preview/route.ts', import.meta.url)
const projectsPath = new URL('../../lib/786-admin/projects.ts', import.meta.url)

test('admin preview reads the same storage model used by admin project persistence', async () => {
  const [route, projects] = await Promise.all([
    readFile(routePath, 'utf8'),
    readFile(projectsPath, 'utf8'),
  ])

  assert.match(projects, /INSERT INTO admin_projects/)
  assert.match(projects, /FROM admin_project_files/)
  assert.match(route, /getProjectWithData/)
  assert.match(route, /admin_projects\/admin_project_files/)
  assert.match(route, /isAdminUser\(email\)/)
})

test('legacy customer preview remains available as a fallback', async () => {
  const route = await readFile(routePath, 'utf8')
  assert.match(route, /FROM projects/)
  assert.match(route, /user_id = \$\{session\.id\}::uuid/)
})
