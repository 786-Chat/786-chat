import "server-only"

import { randomUUID } from "node:crypto"

import { sql, transaction } from "@/lib/786-admin/db"

export function convertNextConfigTs(source: string): string {
  return source
    .replace(/^\s*import\s+type\s+\{\s*NextConfig\s*\}\s+from\s+["']next["'];?\s*$/gm, "")
    .replace(/(:\s*NextConfig|satisfies\s+NextConfig)(?=\s*[=;])/g, "")
    .trimStart()
}

export async function migrateUnsupportedNextConfig(input: {
  projectId: string
  ownerEmail: string
  files: Record<string, string>
}): Promise<boolean> {
  const source = input.files["next.config.ts"]
  if (!source || input.files["next.config.mjs"] || input.files["next.config.js"]) {
    return false
  }

  const revisionId = randomUUID()
  await transaction([
    sql`
      INSERT INTO admin_project_revisions (
        id, project_id, owner_email, label, source, files,
        preview_state, metadata, created_at
      )
      SELECT
        ${revisionId}, p.id, p.owner_email,
        'Before automatic Next config compatibility migration',
        'build-compatibility',
        COALESCE(
          (SELECT jsonb_object_agg(f.path, f.content)
           FROM admin_project_files f WHERE f.project_id = p.id),
          '{}'::jsonb
        ),
        p.preview_state,
        jsonb_build_object('migration', 'next-config-ts-to-mjs'),
        NOW()
      FROM admin_projects p
      WHERE p.id = ${input.projectId}
        AND p.owner_email = ${input.ownerEmail.toLowerCase().trim()}
    `,
    sql`
      DELETE FROM admin_project_files
      WHERE project_id = ${input.projectId}
        AND path = 'next.config.ts'
    `,
    sql`
      INSERT INTO admin_project_files (project_id, path, content, updated_at)
      VALUES (
        ${input.projectId}, 'next.config.mjs',
        ${convertNextConfigTs(source)}, NOW()
      )
      ON CONFLICT (project_id, path)
      DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
    `,
    sql`
      UPDATE admin_projects
      SET metadata = metadata || '{"next_config_compatibility_migrated":true}'::jsonb,
          updated_at = NOW()
      WHERE id = ${input.projectId}
        AND owner_email = ${input.ownerEmail.toLowerCase().trim()}
    `,
  ])
  return true
}
