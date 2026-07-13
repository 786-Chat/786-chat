import { randomUUID } from "node:crypto"
import { sql, transaction } from "./db"
import { getProjectWithData } from "./projects"

export type AdminProjectRevision = {
  id: string
  project_id: string
  owner_email: string
  label: string
  source: string
  files: Record<string, string>
  preview_state: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

export async function ensureProjectRevisionSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_project_revisions (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
      owner_email TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT 'Saved revision',
      source TEXT NOT NULL DEFAULT 'manual',
      files JSONB NOT NULL DEFAULT '{}'::jsonb,
      preview_state JSONB NOT NULL DEFAULT '{}'::jsonb,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_project_revisions_project_created
      ON admin_project_revisions (project_id, created_at DESC)
  `
}

export async function createProjectRevision(input: {
  projectId: string
  ownerEmail: string
  label?: string
  source?: string
}): Promise<AdminProjectRevision> {
  await ensureProjectRevisionSchema()
  const owner = normalizeEmail(input.ownerEmail)
  const project = await getProjectWithData(input.projectId, owner)
  if (!project) throw new Error("Project not found")

  const rows = (await sql`
    INSERT INTO admin_project_revisions (
      id, project_id, owner_email, label, source, files, preview_state, metadata
    ) VALUES (
      ${randomUUID()},
      ${project.id},
      ${owner},
      ${(input.label || "Saved revision").slice(0, 160)},
      ${(input.source || "manual").slice(0, 40)},
      ${JSON.stringify(project.files || {})}::jsonb,
      ${JSON.stringify(project.preview_state || {})}::jsonb,
      ${JSON.stringify(project.metadata || {})}::jsonb
    )
    RETURNING *
  `) as unknown as AdminProjectRevision[]

  return rows[0]
}

export async function listProjectRevisions(
  projectId: string,
  ownerEmail: string,
  limit = 50,
): Promise<AdminProjectRevision[]> {
  await ensureProjectRevisionSchema()
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  return (await sql`
    SELECT id, project_id, owner_email, label, source, files,
           preview_state, metadata, created_at
    FROM admin_project_revisions
    WHERE project_id = ${projectId}
      AND owner_email = ${normalizeEmail(ownerEmail)}
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `) as unknown as AdminProjectRevision[]
}

export async function restoreProjectRevision(input: {
  revisionId: string
  projectId: string
  ownerEmail: string
}): Promise<AdminProjectRevision> {
  await ensureProjectRevisionSchema()
  const owner = normalizeEmail(input.ownerEmail)
  const rows = (await sql`
    SELECT id, project_id, owner_email, label, source, files,
           preview_state, metadata, created_at
    FROM admin_project_revisions
    WHERE id = ${input.revisionId}
      AND project_id = ${input.projectId}
      AND owner_email = ${owner}
    LIMIT 1
  `) as unknown as AdminProjectRevision[]
  const revision = rows[0]
  if (!revision) throw new Error("Revision not found")

  const files = revision.files || {}
  const queries: unknown[] = [
    sql`DELETE FROM admin_project_files WHERE project_id = ${input.projectId}`,
  ]
  for (const [path, content] of Object.entries(files)) {
    queries.push(sql`
      INSERT INTO admin_project_files (project_id, path, content, updated_at)
      VALUES (${input.projectId}, ${path}, ${content}, NOW())
    `)
  }
  queries.push(sql`
    UPDATE admin_projects
    SET preview_state = ${JSON.stringify(revision.preview_state || {})}::jsonb,
        metadata = ${JSON.stringify(revision.metadata || {})}::jsonb,
        updated_at = NOW()
    WHERE id = ${input.projectId} AND owner_email = ${owner}
  `)

  await transaction(queries)
  return revision
}
