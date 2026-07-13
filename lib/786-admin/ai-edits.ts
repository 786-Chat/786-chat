import { createHash, randomUUID } from "node:crypto"
import { sql, transaction } from "./db"
import { createProjectRevision } from "./project-revisions"
import { getFiles, getProject } from "./projects"

export type AiEditChange = {
  path: string
  action: "upsert" | "delete"
  content?: string
  baseHash: string | null
}

export type AiEditProposal = {
  id: string
  project_id: string
  owner_email: string
  prompt: string
  summary: string
  provider: string | null
  model: string | null
  status: "proposed" | "applied" | "rejected" | "conflict" | "failed"
  changes: AiEditChange[]
  error_message: string | null
  created_at: string
  applied_at: string | null
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

function hash(content: string) {
  return createHash("sha256").update(content).digest("hex")
}

function safePath(path: string) {
  const value = path.trim().replaceAll("\\", "/")
  if (!value || value.startsWith("/") || value.includes("..") || value.includes("\0")) {
    throw new Error(`Unsafe project path: ${path}`)
  }
  return value
}

export async function ensureAiEditSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_project_ai_edits (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
      owner_email TEXT NOT NULL,
      prompt TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      provider TEXT,
      model TEXT,
      status TEXT NOT NULL DEFAULT 'proposed',
      changes JSONB NOT NULL DEFAULT '[]'::jsonb,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      applied_at TIMESTAMPTZ
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_project_ai_edits_project_created
      ON admin_project_ai_edits (project_id, created_at DESC)
  `
}

export async function createAiEditProposal(input: {
  projectId: string
  ownerEmail: string
  prompt: string
  summary?: string
  provider?: string | null
  model?: string | null
  changes: Array<{ path: string; action?: "upsert" | "delete"; content?: string }>
}) {
  await ensureAiEditSchema()
  const owner = normalizeEmail(input.ownerEmail)
  const project = await getProject(input.projectId, owner)
  if (!project) throw new Error("Project not found")
  const current = await getFiles(input.projectId)
  if (!input.prompt.trim()) throw new Error("Edit prompt is required")
  if (!Array.isArray(input.changes) || input.changes.length === 0) throw new Error("At least one file change is required")
  if (input.changes.length > 100) throw new Error("Too many file changes")

  const seen = new Set<string>()
  const changes: AiEditChange[] = input.changes.map((change) => {
    const path = safePath(change.path)
    if (seen.has(path)) throw new Error(`Duplicate file change: ${path}`)
    seen.add(path)
    const action = change.action === "delete" ? "delete" : "upsert"
    if (action === "upsert" && typeof change.content !== "string") throw new Error(`Missing content for ${path}`)
    if ((change.content?.length || 0) > 1_000_000) throw new Error(`File is too large: ${path}`)
    return {
      path,
      action,
      content: action === "upsert" ? change.content : undefined,
      baseHash: Object.prototype.hasOwnProperty.call(current, path) ? hash(current[path]) : null,
    }
  })

  const rows = (await sql`
    INSERT INTO admin_project_ai_edits (
      id, project_id, owner_email, prompt, summary, provider, model, changes
    ) VALUES (
      ${randomUUID()}, ${input.projectId}, ${owner}, ${input.prompt.trim()},
      ${(input.summary || "AI multi-file edit").slice(0, 500)},
      ${input.provider ?? null}, ${input.model ?? null}, ${JSON.stringify(changes)}::jsonb
    )
    RETURNING *
  `) as unknown as AiEditProposal[]
  return rows[0]
}

export async function listAiEditProposals(projectId: string, ownerEmail: string, limit = 50) {
  await ensureAiEditSchema()
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  return (await sql`
    SELECT * FROM admin_project_ai_edits
    WHERE project_id = ${projectId} AND owner_email = ${normalizeEmail(ownerEmail)}
    ORDER BY created_at DESC LIMIT ${safeLimit}
  `) as unknown as AiEditProposal[]
}

export async function applyAiEditProposal(input: {
  projectId: string
  proposalId: string
  ownerEmail: string
  acceptedPaths?: string[]
}) {
  await ensureAiEditSchema()
  const owner = normalizeEmail(input.ownerEmail)
  const rows = (await sql`
    SELECT * FROM admin_project_ai_edits
    WHERE id = ${input.proposalId} AND project_id = ${input.projectId} AND owner_email = ${owner}
    LIMIT 1
  `) as unknown as AiEditProposal[]
  const proposal = rows[0]
  if (!proposal) throw new Error("AI edit proposal not found")
  if (proposal.status !== "proposed" && proposal.status !== "conflict") throw new Error(`Proposal is already ${proposal.status}`)

  const accepted = input.acceptedPaths ? new Set(input.acceptedPaths.map(safePath)) : null
  const changes = proposal.changes.filter((change) => !accepted || accepted.has(change.path))
  if (changes.length === 0) throw new Error("No file changes selected")
  const current = await getFiles(input.projectId)
  const conflicts = changes.filter((change) => {
    const currentHash = Object.prototype.hasOwnProperty.call(current, change.path) ? hash(current[change.path]) : null
    return currentHash !== change.baseHash
  })
  if (conflicts.length) {
    await sql`UPDATE admin_project_ai_edits SET status = 'conflict', error_message = ${`Files changed after proposal: ${conflicts.map((item) => item.path).join(", ")}`} WHERE id = ${proposal.id}`
    return { applied: false, conflicts: conflicts.map((item) => item.path) }
  }

  await createProjectRevision({
    projectId: input.projectId,
    ownerEmail: owner,
    label: `Before AI edit: ${proposal.summary}`,
    source: "ai-edit",
  })

  const queries: unknown[] = []
  for (const change of changes) {
    if (change.action === "delete") {
      queries.push(sql`DELETE FROM admin_project_files WHERE project_id = ${input.projectId} AND path = ${change.path}`)
    } else {
      queries.push(sql`
        INSERT INTO admin_project_files (project_id, path, content, updated_at)
        VALUES (${input.projectId}, ${change.path}, ${change.content || ""}, NOW())
        ON CONFLICT (project_id, path) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
      `)
    }
  }
  queries.push(sql`UPDATE admin_projects SET updated_at = NOW() WHERE id = ${input.projectId} AND owner_email = ${owner}`)
  queries.push(sql`UPDATE admin_project_ai_edits SET status = 'applied', error_message = NULL, applied_at = NOW() WHERE id = ${proposal.id}`)
  await transaction(queries)
  return { applied: true, conflicts: [], changedPaths: changes.map((item) => item.path) }
}

export async function rejectAiEditProposal(projectId: string, proposalId: string, ownerEmail: string) {
  await ensureAiEditSchema()
  const rows = (await sql`
    UPDATE admin_project_ai_edits SET status = 'rejected', error_message = NULL
    WHERE id = ${proposalId} AND project_id = ${projectId}
      AND owner_email = ${normalizeEmail(ownerEmail)} AND status IN ('proposed', 'conflict')
    RETURNING id
  `) as unknown as { id: string }[]
  if (!rows[0]) throw new Error("AI edit proposal not found or already completed")
  return true
}
