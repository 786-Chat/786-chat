// Data-access layer for the 786.Chat admin workspace.
// This is the ONLY place that writes SQL for admin_projects /
// admin_project_files / admin_project_messages. Every API route goes
// through these functions to keep behavior consistent and to guarantee
// "editing updates the existing project" (no duplicates).
//
// preview_state and metadata are jsonb bags. Updates MERGE new keys into
// the existing object (PostgreSQL `||` operator) — they do not replace
// the whole object. This lets future systems each own their own keys
// without clobbering each other.

import { randomUUID } from "node:crypto"
import { sql, transaction } from "./db"
import type {
  AdminMessage,
  AdminMessageRole,
  AdminProject,
  AdminProjectFileMap,
  AdminProjectListItem,
  AdminProjectMetadata,
  AdminProjectPreviewState,
  AdminProjectWithData,
} from "./types"

const DEFAULT_KIND = "786chat"

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// ----- Projects (single-statement read/write) -----

export async function listProjects(
  ownerEmail: string,
  kind: string = DEFAULT_KIND
): Promise<AdminProjectListItem[]> {
  const rows = (await sql`
    SELECT
      p.id, p.owner_email, p.kind, p.title, p.description, p.prompt,
      p.preview_state, p.metadata, p.created_at, p.updated_at,
      COALESCE((SELECT COUNT(*) FROM admin_project_files f WHERE f.project_id = p.id), 0) AS file_count,
      COALESCE((SELECT COUNT(*) FROM admin_project_messages m WHERE m.project_id = p.id), 0) AS message_count
    FROM admin_projects p
    WHERE p.owner_email = ${normalizeEmail(ownerEmail)}
      AND p.kind = ${kind}
    ORDER BY p.updated_at DESC
  `) as unknown as AdminProjectListItem[]

  return rows.map((row) => ({
    ...row,
    file_count: Number(row.file_count) || 0,
    message_count: Number(row.message_count) || 0,
  }))
}

export async function getProject(
  id: string,
  ownerEmail: string
): Promise<AdminProject | null> {
  const rows = (await sql`
    SELECT id, owner_email, kind, title, description, prompt,
           preview_state, metadata, created_at, updated_at
    FROM admin_projects
    WHERE id = ${id} AND owner_email = ${normalizeEmail(ownerEmail)}
    LIMIT 1
  `) as unknown as AdminProject[]
  return rows[0] ?? null
}

export async function createProject(
  ownerEmail: string,
  input: {
    title: string
    description?: string
    prompt?: string
    kind?: string
    preview_state?: AdminProjectPreviewState
    metadata?: AdminProjectMetadata
  }
): Promise<AdminProject> {
  const previewJson = JSON.stringify(input.preview_state ?? {})
  const metadataJson = JSON.stringify(input.metadata ?? {})
  const rows = (await sql`
    INSERT INTO admin_projects
      (owner_email, kind, title, description, prompt, preview_state, metadata)
    VALUES (
      ${normalizeEmail(ownerEmail)},
      ${input.kind ?? DEFAULT_KIND},
      ${input.title},
      ${input.description ?? ""},
      ${input.prompt ?? ""},
      ${previewJson}::jsonb,
      ${metadataJson}::jsonb
    )
    RETURNING id, owner_email, kind, title, description, prompt,
              preview_state, metadata, created_at, updated_at
  `) as unknown as AdminProject[]
  return rows[0]
}

// Partial update. preview_state and metadata are MERGED (`||`), never
// replaced — so a system that only touches `theme` will not wipe `layout`.
export async function updateProject(
  id: string,
  ownerEmail: string,
  patch: {
    title?: string
    description?: string
    prompt?: string
    preview_state_patch?: AdminProjectPreviewState
    metadata_patch?: AdminProjectMetadata
  }
): Promise<AdminProject | null> {
  const previewPatch =
    patch.preview_state_patch !== undefined
      ? JSON.stringify(patch.preview_state_patch)
      : null
  const metadataPatch =
    patch.metadata_patch !== undefined
      ? JSON.stringify(patch.metadata_patch)
      : null

  const rows = (await sql`
    UPDATE admin_projects
    SET
      title         = COALESCE(${patch.title ?? null}, title),
      description   = COALESCE(${patch.description ?? null}, description),
      prompt        = COALESCE(${patch.prompt ?? null}, prompt),
      preview_state = CASE
                        WHEN ${previewPatch}::jsonb IS NULL THEN preview_state
                        ELSE preview_state || ${previewPatch}::jsonb
                      END,
      metadata      = CASE
                        WHEN ${metadataPatch}::jsonb IS NULL THEN metadata
                        ELSE metadata || ${metadataPatch}::jsonb
                      END,
      updated_at    = NOW()
    WHERE id = ${id} AND owner_email = ${normalizeEmail(ownerEmail)}
    RETURNING id, owner_email, kind, title, description, prompt,
              preview_state, metadata, created_at, updated_at
  `) as unknown as AdminProject[]
  return rows[0] ?? null
}

export async function deleteProject(
  id: string,
  ownerEmail: string
): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM admin_projects
    WHERE id = ${id} AND owner_email = ${normalizeEmail(ownerEmail)}
    RETURNING id
  `) as unknown as { id: string }[]
  return rows.length > 0
}

// ----- Files (single-statement) -----

export async function getFiles(
  projectId: string
): Promise<AdminProjectFileMap> {
  const rows = (await sql`
    SELECT path, content
    FROM admin_project_files
    WHERE project_id = ${projectId}
    ORDER BY path ASC
  `) as unknown as { path: string; content: string }[]
  const map: AdminProjectFileMap = {}
  for (const row of rows) map[row.path] = row.content
  return map
}

export async function upsertFile(
  projectId: string,
  file: { path: string; content: string; language?: string | null }
): Promise<void> {
  await sql`
    INSERT INTO admin_project_files (project_id, path, content, language, updated_at)
    VALUES (${projectId}, ${file.path}, ${file.content}, ${file.language ?? null}, NOW())
    ON CONFLICT (project_id, path)
    DO UPDATE SET
      content    = EXCLUDED.content,
      language   = EXCLUDED.language,
      updated_at = NOW()
  `
  await sql`UPDATE admin_projects SET updated_at = NOW() WHERE id = ${projectId}`
}

export async function upsertFiles(
  projectId: string,
  files: AdminProjectFileMap
): Promise<number> {
  let count = 0
  for (const [path, content] of Object.entries(files)) {
    await upsertFile(projectId, { path, content })
    count += 1
  }
  return count
}

export async function deleteFile(
  projectId: string,
  path: string
): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM admin_project_files
    WHERE project_id = ${projectId} AND path = ${path}
    RETURNING id
  `) as unknown as { id: string }[]
  return rows.length > 0
}

// ----- Messages (single-statement) -----

export async function getMessages(projectId: string): Promise<AdminMessage[]> {
  const rows = (await sql`
    SELECT id, role, content, model, reason, created_at
    FROM admin_project_messages
    WHERE project_id = ${projectId}
    ORDER BY created_at ASC, id ASC
  `) as unknown as AdminMessage[]
  return rows
}

export async function appendMessage(
  projectId: string,
  message: {
    role: AdminMessageRole
    content: string
    model?: string | null
    reason?: string | null
  }
): Promise<AdminMessage> {
  const rows = (await sql`
    INSERT INTO admin_project_messages (project_id, role, content, model, reason)
    VALUES (
      ${projectId},
      ${message.role},
      ${message.content},
      ${message.model ?? null},
      ${message.reason ?? null}
    )
    RETURNING id, role, content, model, reason, created_at
  `) as unknown as AdminMessage[]
  await sql`UPDATE admin_projects SET updated_at = NOW() WHERE id = ${projectId}`
  return rows[0]
}

// ----- Atomic restore (single read payload) -----

export async function getProjectWithData(
  id: string,
  ownerEmail: string
): Promise<AdminProjectWithData | null> {
  const project = await getProject(id, ownerEmail)
  if (!project) return null
  const [files, messages] = await Promise.all([
    getFiles(project.id),
    getMessages(project.id),
  ])
  return { ...project, files, messages }
}

// ----- Atomic persist (single Neon transaction) -----
//
// Used by POST /api/786-admin/projects and PATCH /api/786-admin/projects/[id]
// when the client sends a full "save" payload (project + files + messages).
// Everything below either commits together or rolls back together.
//
// Behavior:
//   - input.projectId omitted → CREATE
//   - input.projectId present → UPDATE (ownership verified before the tx)
//   - preview_state_patch / metadata_patch are MERGED into existing values
//   - files use ON CONFLICT (project_id, path) DO UPDATE → no duplicate rows
//   - messages are append-only

export type PersistInput = {
  projectId?: string
  title?: string
  description?: string
  prompt?: string
  kind?: string
  preview_state_patch?: AdminProjectPreviewState
  metadata_patch?: AdminProjectMetadata
  files?: AdminProjectFileMap
  messages?: Array<{
    role: AdminMessageRole
    content: string
    model?: string | null
    reason?: string | null
  }>
}

export async function persistProjectAtomic(
  ownerEmail: string,
  input: PersistInput
): Promise<AdminProjectWithData> {
  const owner = normalizeEmail(ownerEmail)
  const isCreate = !input.projectId
  const projectId = input.projectId ?? randomUUID()

  if (!isCreate) {
    const owned = await getProject(projectId, owner)
    if (!owned) {
      throw new Error("Project not found or not owned by this admin")
    }
  } else {
    if (!input.title || !input.title.trim()) {
      throw new Error("title is required to create a project")
    }
  }

  const previewPatch =
    input.preview_state_patch !== undefined
      ? JSON.stringify(input.preview_state_patch)
      : null
  const metadataPatch =
    input.metadata_patch !== undefined
      ? JSON.stringify(input.metadata_patch)
      : null

  const queries: unknown[] = []

  if (isCreate) {
    queries.push(sql`
      INSERT INTO admin_projects
        (id, owner_email, kind, title, description, prompt, preview_state, metadata)
      VALUES (
        ${projectId},
        ${owner},
        ${input.kind ?? DEFAULT_KIND},
        ${input.title!},
        ${input.description ?? ""},
        ${input.prompt ?? ""},
        COALESCE(${previewPatch}::jsonb, '{}'::jsonb),
        COALESCE(${metadataPatch}::jsonb, '{}'::jsonb)
      )
    `)
  } else {
    queries.push(sql`
      UPDATE admin_projects
      SET
        title         = COALESCE(${input.title ?? null}, title),
        description   = COALESCE(${input.description ?? null}, description),
        prompt        = COALESCE(${input.prompt ?? null}, prompt),
        preview_state = CASE
                          WHEN ${previewPatch}::jsonb IS NULL THEN preview_state
                          ELSE preview_state || ${previewPatch}::jsonb
                        END,
        metadata      = CASE
                          WHEN ${metadataPatch}::jsonb IS NULL THEN metadata
                          ELSE metadata || ${metadataPatch}::jsonb
                        END,
        updated_at    = NOW()
      WHERE id = ${projectId} AND owner_email = ${owner}
    `)
  }

  if (input.files) {
    for (const [path, content] of Object.entries(input.files)) {
      queries.push(sql`
        INSERT INTO admin_project_files (project_id, path, content, updated_at)
        VALUES (${projectId}, ${path}, ${content}, NOW())
        ON CONFLICT (project_id, path)
        DO UPDATE SET
          content    = EXCLUDED.content,
          updated_at = NOW()
      `)
    }
  }

  if (input.messages) {
    for (const m of input.messages) {
      queries.push(sql`
        INSERT INTO admin_project_messages (project_id, role, content, model, reason)
        VALUES (
          ${projectId},
          ${m.role},
          ${m.content},
          ${m.model ?? null},
          ${m.reason ?? null}
        )
      `)
    }
  }

  queries.push(sql`
    UPDATE admin_projects SET updated_at = NOW() WHERE id = ${projectId}
  `)

  await transaction(queries)

  const result = await getProjectWithData(projectId, owner)
  if (!result) {
    throw new Error("Persistence committed but project could not be read back")
  }
  return result
}
