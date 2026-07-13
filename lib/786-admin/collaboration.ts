import { randomUUID } from "node:crypto"
import { sql } from "./db"

export type ProjectRole = "owner" | "editor" | "reviewer" | "viewer"

export type ProjectCollaborator = {
  id: string
  project_id: string
  email: string
  role: ProjectRole
  invited_by: string
  created_at: string
  updated_at: string
}

export type ProjectComment = {
  id: string
  project_id: string
  author_email: string
  body: string
  file_path: string | null
  line_number: number | null
  status: "open" | "resolved"
  created_at: string
  updated_at: string
}

function normalizeEmail(value: string) {
  return value.toLowerCase().trim()
}

export async function ensureCollaborationSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_project_collaborators (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner','editor','reviewer','viewer')),
      invited_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(project_id, email)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS admin_project_comments (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
      author_email TEXT NOT NULL,
      body TEXT NOT NULL,
      file_path TEXT,
      line_number INTEGER,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_project_collaborators_project
    ON admin_project_collaborators(project_id)
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_project_comments_project_created
    ON admin_project_comments(project_id, created_at DESC)
  `
}

export async function getProjectRole(projectId: string, email: string): Promise<ProjectRole | null> {
  await ensureCollaborationSchema()
  const normalized = normalizeEmail(email)
  const rows = (await sql`
    SELECT 'owner'::text AS role
    FROM admin_projects
    WHERE id = ${projectId} AND owner_email = ${normalized}
    UNION ALL
    SELECT role
    FROM admin_project_collaborators
    WHERE project_id = ${projectId} AND email = ${normalized}
    LIMIT 1
  `) as unknown as Array<{ role: ProjectRole }>
  return rows[0]?.role ?? null
}

export async function listCollaborators(projectId: string, ownerEmail: string) {
  const role = await getProjectRole(projectId, ownerEmail)
  if (role !== "owner") throw new Error("Forbidden")
  return (await sql`
    SELECT id, project_id, email, role, invited_by, created_at, updated_at
    FROM admin_project_collaborators
    WHERE project_id = ${projectId}
    ORDER BY created_at ASC
  `) as unknown as ProjectCollaborator[]
}

export async function upsertCollaborator(input: {
  projectId: string
  ownerEmail: string
  email: string
  role: Exclude<ProjectRole, "owner">
}) {
  const role = await getProjectRole(input.projectId, input.ownerEmail)
  if (role !== "owner") throw new Error("Forbidden")
  const email = normalizeEmail(input.email)
  if (email === normalizeEmail(input.ownerEmail)) throw new Error("Owner is already a member")
  const rows = (await sql`
    INSERT INTO admin_project_collaborators (id, project_id, email, role, invited_by)
    VALUES (${randomUUID()}, ${input.projectId}, ${email}, ${input.role}, ${normalizeEmail(input.ownerEmail)})
    ON CONFLICT (project_id, email)
    DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()
    RETURNING id, project_id, email, role, invited_by, created_at, updated_at
  `) as unknown as ProjectCollaborator[]
  return rows[0]
}

export async function removeCollaborator(projectId: string, ownerEmail: string, collaboratorEmail: string) {
  const role = await getProjectRole(projectId, ownerEmail)
  if (role !== "owner") throw new Error("Forbidden")
  const rows = (await sql`
    DELETE FROM admin_project_collaborators
    WHERE project_id = ${projectId} AND email = ${normalizeEmail(collaboratorEmail)}
    RETURNING id
  `) as unknown as Array<{ id: string }>
  return rows.length > 0
}

export async function listComments(projectId: string, email: string) {
  const role = await getProjectRole(projectId, email)
  if (!role) throw new Error("Forbidden")
  return (await sql`
    SELECT id, project_id, author_email, body, file_path, line_number, status, created_at, updated_at
    FROM admin_project_comments
    WHERE project_id = ${projectId}
    ORDER BY created_at ASC
  `) as unknown as ProjectComment[]
}

export async function createComment(input: {
  projectId: string
  email: string
  body: string
  filePath?: string | null
  lineNumber?: number | null
}) {
  const role = await getProjectRole(input.projectId, input.email)
  if (!role) throw new Error("Forbidden")
  const body = input.body.trim()
  if (!body) throw new Error("Comment body is required")
  const rows = (await sql`
    INSERT INTO admin_project_comments (
      id, project_id, author_email, body, file_path, line_number
    ) VALUES (
      ${randomUUID()}, ${input.projectId}, ${normalizeEmail(input.email)}, ${body.slice(0, 4000)},
      ${input.filePath ?? null}, ${input.lineNumber ?? null}
    )
    RETURNING id, project_id, author_email, body, file_path, line_number, status, created_at, updated_at
  `) as unknown as ProjectComment[]
  return rows[0]
}

export async function setCommentStatus(input: {
  projectId: string
  commentId: string
  email: string
  status: "open" | "resolved"
}) {
  const role = await getProjectRole(input.projectId, input.email)
  if (!role || role === "viewer") throw new Error("Forbidden")
  const rows = (await sql`
    UPDATE admin_project_comments
    SET status = ${input.status}, updated_at = NOW()
    WHERE id = ${input.commentId} AND project_id = ${input.projectId}
    RETURNING id, project_id, author_email, body, file_path, line_number, status, created_at, updated_at
  `) as unknown as ProjectComment[]
  if (!rows[0]) throw new Error("Comment not found")
  return rows[0]
}
