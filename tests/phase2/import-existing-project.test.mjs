import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("existing-project ZIP import creates a new isolated builder project without touching saved projects", async () => {
  const [route, importer, page] = await Promise.all([
    read("app/api/786-chat/import/route.ts"),
    read("components/786-chat/project-import.ts"),
    read("components/786-chat/import-existing-project-page.tsx"),
  ])

  assert.match(route, /createProject\(session\.email/)
  assert.match(route, /builderPlanUsage/)
  assert.match(route, /requires_compatibility_review:\s*true/)
  assert.match(route, /requires_security_review:\s*true/)
  assert.match(route, /blockedSecretPath/)
  assert.match(route, /upsertFiles\(projectId, files\)/)
  assert.doesNotMatch(route, /deleteProject/)

  assert.match(importer, /0x06054b50/)
  assert.match(importer, /DecompressionStream/)
  assert.match(importer, /\/api\/upload/)
  assert.match(importer, /migration\/asset-map\.json/)
  assert.match(importer, /action:\s*"finalize"/)
  assert.match(importer, /queueImportedBuild/)
  assert.match(importer, /\/api\/786-chat\/projects\/\$\{projectId\}\/build/)
  assert.match(importer, /framework:\s*framework === "vite" \? "vite" : "express"/)
  assert.match(importer, /sql\/migrations\/001_initial\.sql/)
  assert.match(importer, /server\/db\.ts/)
  assert.match(importer, /REPLACE_WITH_VITE_GOOGLE_MAPS_API_KEY/)
  assert.match(importer, /repairMissingReplitAssetImports/)

  assert.match(page, /Creates a new separate 786\.Chat project/)
  assert.match(page, /verified preview build is queued automatically/)
  assert.doesNotMatch(page, /Raja Catering/)
  assert.match(page, /Import as new project/)
})

test("imported Vite Express projects use compatibility validation without weakening normal Next builds", async () => {
  const [validation, buildRoute] = await Promise.all([
    read("lib/786-admin/build-validation.ts"),
    read("app/api/786-admin/projects/[id]/build/route.ts"),
  ])

  assert.match(validation, /export type BuildValidationOptions/)
  assert.match(validation, /IMPORT_MAX_TOTAL_BYTES/)
  assert.match(validation, /framework === "vite-express"/)
  assert.match(validation, /MISSING_VITE/)
  assert.match(validation, /MISSING_EXPRESS/)
  assert.match(validation, /if \(!imported && !allDependencies\.next\)/)
  assert.match(validation, /if \(imported\) warnings\.push\(issue\)/)
  assert.match(validation, /if \(imported && scripts\.check\)/)

  assert.match(buildRoute, /importedBuildOptions/)
  assert.match(buildRoute, /validateGeneratedProject\(project\.files \|\| \{\}, buildOptions\)/)
  assert.match(buildRoute, /buildOptions\.imported\s*\? false\s*:\s*await repairMissingScaffold/)
  assert.match(buildRoute, /Imported project passed compatibility validation and the preview build was queued/)
})