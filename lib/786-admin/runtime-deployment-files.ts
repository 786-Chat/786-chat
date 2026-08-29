export function runtimeDeploymentFiles(files: Record<string, string>): Record<string, string> {
  const initialMigration = files["sql/migrations/001_initial.sql"]?.trim()
  const schemaSnapshot = files["sql/schema.sql"]?.trim()

  if (!initialMigration || !schemaSnapshot) return files

  // The generated runtime database deployer treats sql/schema.sql as the base when it
  // exists. Some long-lived projects keep schema.sql as a small latest-feature snapshot
  // while 001_initial.sql contains the real base tables. Hide the partial snapshot only
  // for runtime provisioning so migrations always start from 001_initial.sql. The saved
  // project files and the published generated source remain unchanged.
  const runtimeFiles = { ...files }
  delete runtimeFiles["sql/schema.sql"]
  return runtimeFiles
}
