export function runtimeDeploymentFiles(files: Record<string, string>): Record<string, string> {
  // Work on a runtime-only copy so imported/saved project source is never rewritten.
  const runtimeFiles = { ...files }

  // Drizzle migration exports separate statements with `--> statement-breakpoint`.
  // The Neon HTTP driver executes one prepared statement at a time, so normalize those
  // markers to newlines before the runtime database deployer splits on semicolons.
  for (const [path, source] of Object.entries(runtimeFiles)) {
    if (/^sql\/(?:schema\.sql|migrations\/.+\.sql)$/i.test(path)) {
      runtimeFiles[path] = source.replace(/-->\s*statement-breakpoint\s*/gi, "\n")
    }
  }

  const initialMigration = runtimeFiles["sql/migrations/001_initial.sql"]?.trim()
  const schemaSnapshot = runtimeFiles["sql/schema.sql"]?.trim()

  if (!initialMigration || !schemaSnapshot) return runtimeFiles

  // The generated runtime database deployer treats sql/schema.sql as the base when it
  // exists. Some long-lived projects keep schema.sql as a small latest-feature snapshot
  // while 001_initial.sql contains the real base tables. Hide the partial snapshot only
  // for runtime provisioning so migrations always start from 001_initial.sql. The saved
  // project files and the published generated source remain unchanged.
  delete runtimeFiles["sql/schema.sql"]
  return runtimeFiles
}
