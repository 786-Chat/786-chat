import { createHash, randomUUID } from "node:crypto"
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

function orderedRecord(value: Record<string, string>) {
  return Object.fromEntries(Object.entries(value || {}).sort(([a], [b]) => a.localeCompare(b)))
}

function revisionFingerprint(input: {
  files: Record<string, string>
  preview_state: Record<string, unknown>
  metadata: Record<string, unknown>
}) {
  return createHash("sha256").update(JSON.stringify({
    files: orderedRecord(input.files || {}),
    preview_state: input.preview_state || {},
    metadata: input.metadata || {},
  })).digest("hex")
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

export async function undoLatestProjectChange(input: {
  projectId: string
  ownerEmail: string
  message?: string
}) {
  await ensureProjectRevisionSchema()
  const owner = normalizeEmail(input.ownerEmail)
  const project = await getProjectWithData(input.projectId, owner)
  if (!project) throw new Error("Project not found")

  const currentFingerprint = revisionFingerprint({
    files: project.files || {},
    preview_state: project.preview_state || {},
    metadata: project.metadata || {},
  })
  const revisions = await listProjectRevisions(input.projectId, owner, 100)
  const target = revisions.find((revision) =>
    !["undo-safety", "restore-safety"].includes(revision.source) &&
    revisionFingerprint(revision) !== currentFingerprint
  )
  if (!target) return null

  const currentFiles = project.files || {}
  const currentFilesJson = JSON.stringify(currentFiles)
  const currentPreviewJson = JSON.stringify(project.preview_state || {})
  const currentMetadataJson = JSON.stringify(project.metadata || {})
  const targetPreviewJson = JSON.stringify(target.preview_state || {})
  const targetMetadataJson = JSON.stringify(target.metadata || {})
  const userMessage = (input.message || "Undo the last change").trim().slice(0, 2_000)
  const assistantMessage = `Undid the last saved change and restored “${target.label}”.`
  const queries: unknown[] = [
    sql`
      INSERT INTO admin_project_revisions (
        id, project_id, owner_email, label, source, files, preview_state, metadata
      ) VALUES (
        ${randomUUID()}, ${project.id}, ${owner}, 'Before undo', 'undo-safety',
        ${currentFilesJson}::jsonb, ${currentPreviewJson}::jsonb,
        ${currentMetadataJson}::jsonb
      )
    `,
    sql`DELETE FROM admin_project_files WHERE project_id = ${project.id}`,
  ]
  for (const [path, content] of Object.entries(target.files || {})) {
    queries.push(sql`
      INSERT INTO admin_project_files (project_id, path, content, updated_at)
      VALUES (${project.id}, ${path}, ${content}, NOW())
    `)
  }
  queries.push(
    sql`
      UPDATE admin_projects
      SET preview_state = ${targetPreviewJson}::jsonb,
          metadata = ${targetMetadataJson}::jsonb,
          updated_at = NOW()
      WHERE id = ${project.id} AND owner_email = ${owner}
    `,
    sql`
      INSERT INTO admin_project_messages (project_id, role, content, created_at)
      VALUES (${project.id}, 'user', ${userMessage}, NOW())
    `,
    sql`
      INSERT INTO admin_project_messages (project_id, role, content, reason, created_at)
      VALUES (${project.id}, 'assistant', ${assistantMessage}, 'deterministic-revision-undo', NOW())
    `,
  )

  await transaction(queries)
  const restoredProject = await getProjectWithData(project.id, owner)
  if (!restoredProject) throw new Error("Undo completed but project could not be read back")
  return { project: restoredProject, restoredRevision: target }
}
