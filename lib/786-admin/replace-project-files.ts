import { sql, transaction } from "@/lib/786-admin/db"
import type { AdminProjectFileMap } from "@/lib/786-admin/types"

/**
 * Replace the complete generated file set for one project.
 *
 * AI generation returns a complete project snapshot. Keeping files that are
 * absent from the new snapshot causes old pages, CSS and menu data to leak
 * into later previews. This helper removes the previous snapshot before
 * inserting the new one in a single Neon transaction.
 */
export async function replaceProjectFiles(
  projectId: string,
  files: AdminProjectFileMap,
): Promise<void> {
  const queries: unknown[] = [
    sql`DELETE FROM admin_project_files WHERE project_id = ${projectId}`,
  ]

  for (const [path, content] of Object.entries(files)) {
    queries.push(sql`
      INSERT INTO admin_project_files (project_id, path, content, updated_at)
      VALUES (${projectId}, ${path}, ${content}, NOW())
    `)
  }

  queries.push(sql`
    UPDATE admin_projects SET updated_at = NOW() WHERE id = ${projectId}
  `)

  await transaction(queries)
}
