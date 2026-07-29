import { randomUUID } from "node:crypto"

import { getProjectWithData } from "@/lib/786-admin/projects"
import { sql, transaction } from "@/lib/786-admin/db"
import type { AdminProjectWithData } from "@/lib/786-admin/types"

export type SaveGeneratedProjectInput = {
  projectId?: string | null
  ownerEmail: string
  title: string
  description: string
  prompt: string
  files: Record<string, string>
  previewState: Record<string, unknown>
  metadata: Record<string, unknown>
  messages: Array<{
    role: "user" | "assistant" | "system"
    content: string
    model?: string | null
    reason?: string | null
  }>
}

function normalizedEmail(email: string) {
  return email.toLowerCase().trim()
}

export async function saveGeneratedProjectAtomic(
  input: SaveGeneratedProjectInput,
): Promise<AdminProjectWithData> {
  const owner = normalizedEmail(input.ownerEmail)
  const projectId = input.projectId || randomUUID()
  const creating = !input.projectId
  const revisionId = randomUUID()
  const generationJobId = randomUUID()
  const previewJson = JSON.stringify(input.previewState)
  const metadataJson = JSON.stringify(input.metadata)
  const filesJson = JSON.stringify(input.files)
  const queries: unknown[] = []

  if (creating) {
    queries.push(sql`
      INSERT INTO admin_projects (
        id, owner_email, kind, title, description, prompt,
        preview_state, metadata, created_at, updated_at
      ) VALUES (
        ${projectId}, ${owner}, '786chat', ${input.title},
        ${input.description}, ${input.prompt}, ${previewJson}::jsonb,
        ${metadataJson}::jsonb, NOW(), NOW()
      )
    `)
  } else {
    queries.push(sql`
      INSERT INTO admin_project_revisions (
        id, project_id, owner_email, label, source, files,
        preview_state, metadata, created_at
      )
      SELECT
        ${revisionId}, p.id, p.owner_email, 'Before AI generation',
        'generation', COALESCE(
          (
            SELECT jsonb_object_agg(f.path, f.content)
            FROM admin_project_files f
            WHERE f.project_id = p.id
          ),
          '{}'::jsonb
        ), p.preview_state, p.metadata, NOW()
      FROM admin_projects p
      WHERE p.id = ${projectId} AND p.owner_email = ${owner}
    `)
    queries.push(sql`
      UPDATE admin_projects
      SET title = ${input.title},
          description = ${input.description},
          prompt = ${input.prompt},
          preview_state = ${previewJson}::jsonb,
          metadata = metadata || ${metadataJson}::jsonb,
          updated_at = NOW()
      WHERE id = ${projectId} AND owner_email = ${owner}
    `)
    queries.push(sql`
      DELETE FROM admin_project_files
      WHERE project_id = ${projectId}
    `)
  }

  for (const [path, content] of Object.entries(input.files)) {
    queries.push(sql`
      INSERT INTO admin_project_files (project_id, path, content, updated_at)
      VALUES (${projectId}, ${path}, ${content}, NOW())
    `)
  }

  for (const message of input.messages) {
    queries.push(sql`
      INSERT INTO admin_project_messages (
        project_id, role, content, model, reason, created_at
      ) VALUES (
        ${projectId}, ${message.role}, ${message.content},
        ${message.model ?? null}, ${message.reason ?? null}, NOW()
      )
    `)
  }

  if (creating) {
    queries.push(sql`
      INSERT INTO admin_project_revisions (
        id, project_id, owner_email, label, source, files,
        preview_state, metadata, created_at
      ) VALUES (
        ${revisionId}, ${projectId}, ${owner}, 'Initial generated project',
        'generation', ${filesJson}::jsonb, ${previewJson}::jsonb,
        ${metadataJson}::jsonb, NOW()
      )
    `)
  }

  queries.push(sql`
    INSERT INTO builder_generation_jobs (
      id, project_id, owner_email, status, prompt, specification,
      implementation_plan, validation, provider, created_at, completed_at
    ) VALUES (
      ${generationJobId}, ${projectId}, ${owner}, 'validated', ${input.prompt},
      ${JSON.stringify(input.metadata.specification || {})}::jsonb,
      ${JSON.stringify(input.metadata.plan || {})}::jsonb,
      ${JSON.stringify(input.metadata.validation || {})}::jsonb,
      ${String(input.metadata.model || "") || null}, NOW(), NOW()
    )
  `)

  await transaction(queries)
  const saved = await getProjectWithData(projectId, owner)
  if (!saved) throw new Error("Project transaction committed but could not be read back.")
  return saved
}
