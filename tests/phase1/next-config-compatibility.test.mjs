import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("new project plans and generator contract use portable Next config", async () => {
  const [planner, codegen] = await Promise.all([
    read("lib/786-chat/planner.ts"),
    read("lib/786-admin/codegen.ts"),
  ])

  assert.match(planner, /next\.config\.mjs/)
  assert.doesNotMatch(planner, /next\.config\.ts/)
  assert.match(codegen, /Never create next\.config\.ts/)
})

test("isolated build validation rejects unsupported next.config.ts", async () => {
  const validation = await read("lib/786-admin/build-validation.ts")

  assert.match(validation, /UNSUPPORTED_NEXT_CONFIG_TS/)
  assert.match(validation, /next\.config\.mjs or next\.config\.js/)
})

test("confirmed builds migrate an existing TypeScript Next config transactionally", async () => {
  const [route, compatibility] = await Promise.all([
    read("app/api/786-admin/projects/[id]/build/route.ts"),
    read("lib/786-chat/project-compatibility.ts"),
  ])

  assert.match(route, /migrateUnsupportedNextConfig/)
  assert.match(route, /body\.confirm === true/)
  assert.match(compatibility, /transaction\(queries\)/)
  assert.match(compatibility, /admin_project_revisions/)
  assert.match(compatibility, /DELETE FROM admin_project_files/)
  assert.match(compatibility, /next\.config\.mjs/)
})

test("confirmed builds isolate Tailwind tooling from the parent repository", async () => {
  const compatibility = await read("lib/786-chat/project-compatibility.ts")

  assert.match(compatibility, /normalizePortablePostCss/)
  assert.match(compatibility, /postcss\.config\.cjs/)
  assert.match(compatibility, /postcss\.config\.mjs/)
  assert.match(compatibility, /@tailwindcss\/postcss/)
  assert.match(compatibility, /local-postcss-config/)
  assert.match(compatibility, /delete normalized\["package-lock\.json"\]/)
  assert.match(compatibility, /tailwind\.config\.cjs/)
  assert.match(compatibility, /\.\/app\/\*\*\/\*\.\{js,ts,jsx,tsx,mdx\}/)
  assert.match(compatibility, /local-tailwind-config/)
})
