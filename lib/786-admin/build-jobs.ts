import { sql } from "./db"

export type AdminProjectBuildStatus =
  | "queued"
  | "running"
  | "passed"
  | "failed"
  | "cancelled"

export type AdminProjectBuild = {
  id: string
  project_id: string
  status: AdminProjectBuildStatus
  package_manager: "npm" | "pnpm" | "yarn"
  commands: string[]
  logs: string
  error_message: string | null
  source_version: string
  github_branch: string | null
  github_commit_sha: string | null
  github_pr_url: string | null
  deployment_url: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export async function ensureBuildJobsSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_project_builds (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id         UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
      status             TEXT NOT NULL DEFAULT 'queued'
                         CHECK (status IN ('queued','running','passed','failed','cancelled')),
      package_manager    TEXT NOT NULL
                         CHECK (package_manager IN ('npm','pnpm','yarn')),
      commands           JSONB NOT NULL DEFAULT '[]'::jsonb,
      logs               TEXT NOT NULL DEFAULT '',
      error_message      TEXT,
      source_version     TEXT NOT NULL,
      github_branch      TEXT,
      github_commit_sha  TEXT,
      github_pr_url      TEXT,
      deployment_url     TEXT,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at         TIMESTAMPTZ,
      completed_at       TIMESTAMPTZ,
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_project_builds_project_created
      ON admin_project_builds (project_id, created_at DESC)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_project_builds_status
      ON admin_project_builds (status, created_at ASC)
  `
}

export async function createBuildJob(input: {
  projectId: string
  ownerEmail: string
  packageManager: "npm" | "pnpm" | "yarn"
  commands: string[]
  sourceVersion: string
}): Promise<AdminProjectBuild> {
  await ensureBuildJobsSchema()

  const rows = (await sql`
    INSERT INTO admin_project_builds (
      project_id,
      status,
      package_manager,
      commands,
      source_version,
      created_at,
      updated_at
    )
    SELECT
      p.id,
      'queued',
      ${input.packageManager},
      ${JSON.stringify(input.commands)}::jsonb,
      ${input.sourceVersion},
      NOW(),
      NOW()
    FROM admin_projects p
    WHERE p.id = ${input.projectId}
      AND p.owner_email = ${normalizeEmail(input.ownerEmail)}
    RETURNING *
  `) as unknown as AdminProjectBuild[]

  if (!rows[0]) throw new Error("Project not found")
  return rows[0]
}

export async function getLatestBuildJob(
  projectId: string,
  ownerEmail: string,
): Promise<AdminProjectBuild | null> {
  await ensureBuildJobsSchema()

  const rows = (await sql`
    SELECT b.*
    FROM admin_project_builds b
    INNER JOIN admin_projects p ON p.id = b.project_id
    WHERE b.project_id = ${projectId}
      AND p.owner_email = ${normalizeEmail(ownerEmail)}
    ORDER BY b.created_at DESC
    LIMIT 1
  `) as unknown as AdminProjectBuild[]

  return rows[0] ?? null
}

export async function appendBuildLog(input: {
  buildId: string
  line: string
  status?: AdminProjectBuildStatus
  errorMessage?: string | null
}): Promise<void> {
  await ensureBuildJobsSchema()

  await sql`
    UPDATE admin_project_builds
    SET logs = logs || ${`${input.line}\n`},
        status = COALESCE(${input.status ?? null}, status),
        error_message = COALESCE(${input.errorMessage ?? null}, error_message),
        started_at = CASE
          WHEN ${input.status ?? null} = 'running' AND started_at IS NULL THEN NOW()
          ELSE started_at
        END,
        completed_at = CASE
          WHEN ${input.status ?? null} IN ('passed','failed','cancelled') THEN NOW()
          ELSE completed_at
        END,
        updated_at = NOW()
    WHERE id = ${input.buildId}
  `
}
