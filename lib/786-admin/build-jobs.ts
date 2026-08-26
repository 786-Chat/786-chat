import { sql } from "./db"

const QUEUED_BUILD_TIMEOUT_MS = 5 * 60 * 1000

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
  parent_build_id: string | null
  repair_attempt: number
  repair_status: "not_needed" | "pending" | "running" | "repaired" | "exhausted"
  created_at: string
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

function normalizeTerminalPublishRepairState(build: AdminProjectBuild | null): AdminProjectBuild | null {
  if (
    build?.status === "failed" &&
    build.github_commit_sha &&
    !build.deployment_url &&
    ["pending", "running", "repaired"].includes(build.repair_status)
  ) {
    return { ...build, repair_status: "not_needed" }
  }
  return build
}

async function expireStaleQueuedBuilds(projectId: string, ownerEmail: string): Promise<void> {
  const staleBefore = new Date(Date.now() - QUEUED_BUILD_TIMEOUT_MS).toISOString()
  await sql`
    UPDATE admin_project_builds b
    SET status = 'failed',
        error_message = 'Build dispatch timed out before the isolated runner started. Safe to retry.',
        logs = b.logs || E'\n[reconcile] Queued build exceeded dispatch timeout before runner start; released for retry.\n',
        completed_at = NOW(),
        updated_at = NOW()
    FROM admin_projects p
    WHERE b.project_id = ${projectId}
      AND p.id = b.project_id
      AND p.owner_email = ${normalizeEmail(ownerEmail)}
      AND b.status = 'queued'
      AND b.started_at IS NULL
      AND b.updated_at < ${staleBefore}::timestamptz
  `
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
      parent_build_id    UUID REFERENCES admin_project_builds(id) ON DELETE SET NULL,
      repair_attempt     INTEGER NOT NULL DEFAULT 0 CHECK (repair_attempt BETWEEN 0 AND 2),
      repair_status      TEXT NOT NULL DEFAULT 'not_needed'
                         CHECK (repair_status IN ('not_needed','pending','running','repaired','exhausted')),
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

  await sql`
    ALTER TABLE admin_project_builds
      ADD COLUMN IF NOT EXISTS parent_build_id UUID REFERENCES admin_project_builds(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS repair_attempt INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS repair_status TEXT NOT NULL DEFAULT 'not_needed'
  `
}

export async function createBuildJob(input: {
  projectId: string
  ownerEmail: string
  packageManager: "npm" | "pnpm" | "yarn"
  commands: string[]
  sourceVersion: string
  parentBuildId?: string | null
  repairAttempt?: number
}): Promise<AdminProjectBuild> {
  await ensureBuildJobsSchema()

  const rows = (await sql`
    INSERT INTO admin_project_builds (
      project_id,
      status,
      package_manager,
      commands,
      source_version,
      parent_build_id,
      repair_attempt,
      repair_status,
      created_at,
      updated_at
    )
    SELECT
      p.id,
      'queued',
      ${input.packageManager},
      ${JSON.stringify(input.commands)}::jsonb,
      ${input.sourceVersion},
      ${input.parentBuildId ?? null}::uuid,
      ${input.repairAttempt ?? 0},
      ${input.parentBuildId ? "pending" : "not_needed"},
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
  await expireStaleQueuedBuilds(projectId, ownerEmail)

  const rows = (await sql`
    SELECT b.*
    FROM admin_project_builds b
    INNER JOIN admin_projects p ON p.id = b.project_id
    WHERE b.project_id = ${projectId}
      AND p.owner_email = ${normalizeEmail(ownerEmail)}
    ORDER BY b.created_at DESC
    LIMIT 1
  `) as unknown as AdminProjectBuild[]

  return normalizeTerminalPublishRepairState(rows[0] ?? null)
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
