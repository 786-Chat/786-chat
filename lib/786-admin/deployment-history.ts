import { sql } from "./db"
import { ensureBuildJobsSchema, type AdminProjectBuild } from "./build-jobs"

export type DeploymentHistorySummary = {
  total: number
  passed: number
  failed: number
  running: number
  queued: number
  cancelled: number
  deployed: number
  success_rate: number
  latest_deployment_url: string | null
  latest_completed_at: string | null
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export async function listDeploymentHistory(input: {
  projectId: string
  ownerEmail: string
  limit?: number
}): Promise<AdminProjectBuild[]> {
  await ensureBuildJobsSchema()
  const safeLimit = Math.min(Math.max(input.limit ?? 30, 1), 100)

  return (await sql`
    SELECT b.*
    FROM admin_project_builds b
    INNER JOIN admin_projects p ON p.id = b.project_id
    WHERE b.project_id = ${input.projectId}
      AND p.owner_email = ${normalizeEmail(input.ownerEmail)}
    ORDER BY b.created_at DESC
    LIMIT ${safeLimit}
  `) as unknown as AdminProjectBuild[]
}

export async function getDeploymentHistorySummary(input: {
  projectId: string
  ownerEmail: string
}): Promise<DeploymentHistorySummary | null> {
  await ensureBuildJobsSchema()

  const rows = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE b.status = 'passed')::int AS passed,
      COUNT(*) FILTER (WHERE b.status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE b.status = 'running')::int AS running,
      COUNT(*) FILTER (WHERE b.status = 'queued')::int AS queued,
      COUNT(*) FILTER (WHERE b.status = 'cancelled')::int AS cancelled,
      COUNT(*) FILTER (WHERE b.deployment_url IS NOT NULL)::int AS deployed,
      COALESCE(
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE b.status = 'passed') /
          NULLIF(COUNT(*) FILTER (WHERE b.status IN ('passed','failed','cancelled')), 0),
          1
        ),
        0
      )::float AS success_rate,
      (
        SELECT b2.deployment_url
        FROM admin_project_builds b2
        WHERE b2.project_id = ${input.projectId}
          AND b2.deployment_url IS NOT NULL
        ORDER BY b2.created_at DESC
        LIMIT 1
      ) AS latest_deployment_url,
      MAX(b.completed_at) AS latest_completed_at
    FROM admin_project_builds b
    INNER JOIN admin_projects p ON p.id = b.project_id
    WHERE b.project_id = ${input.projectId}
      AND p.owner_email = ${normalizeEmail(input.ownerEmail)}
  `) as unknown as DeploymentHistorySummary[]

  return rows[0] ?? null
}
