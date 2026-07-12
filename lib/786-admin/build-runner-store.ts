import { sql } from "./db"
import type { AdminProjectBuildStatus } from "./build-jobs"

export type RunnerBuildBundle = {
  buildId: string
  projectId: string
  title: string
  files: Record<string, string>
  commands: string[]
  packageManager: "npm" | "pnpm" | "yarn"
  sourceVersion: string
}

export async function getRunnerBuildBundle(buildId: string): Promise<RunnerBuildBundle | null> {
  const builds = (await sql`
    SELECT b.id, b.project_id, b.commands, b.package_manager, b.source_version, p.title
    FROM admin_project_builds b
    INNER JOIN admin_projects p ON p.id = b.project_id
    WHERE b.id = ${buildId}
      AND b.status IN ('queued','running')
    LIMIT 1
  `) as unknown as Array<{
    id: string
    project_id: string
    commands: string[]
    package_manager: "npm" | "pnpm" | "yarn"
    source_version: string
    title: string
  }>

  const build = builds[0]
  if (!build) return null

  const rows = (await sql`
    SELECT path, content
    FROM admin_project_files
    WHERE project_id = ${build.project_id}
    ORDER BY path ASC
  `) as unknown as Array<{ path: string; content: string }>

  const files: Record<string, string> = {}
  for (const row of rows) files[row.path] = row.content

  await sql`
    UPDATE admin_project_builds
    SET status = 'running',
        started_at = COALESCE(started_at, NOW()),
        logs = logs || ${"[runner] Source bundle downloaded.\n"},
        updated_at = NOW()
    WHERE id = ${build.id}
      AND status IN ('queued','running')
  `

  return {
    buildId: build.id,
    projectId: build.project_id,
    title: build.title,
    files,
    commands: Array.isArray(build.commands) ? build.commands : [],
    packageManager: build.package_manager,
    sourceVersion: build.source_version,
  }
}

export async function completeRunnerBuild(input: {
  buildId: string
  status: Extract<AdminProjectBuildStatus, "passed" | "failed" | "cancelled">
  logs: string
  errorMessage?: string | null
  githubBranch?: string | null
  githubCommitSha?: string | null
  githubPrUrl?: string | null
  deploymentUrl?: string | null
}): Promise<boolean> {
  const rows = (await sql`
    UPDATE admin_project_builds
    SET status = ${input.status},
        logs = logs || ${input.logs.slice(0, 1_000_000)},
        error_message = ${input.errorMessage?.slice(0, 4000) ?? null},
        github_branch = COALESCE(${input.githubBranch ?? null}, github_branch),
        github_commit_sha = COALESCE(${input.githubCommitSha ?? null}, github_commit_sha),
        github_pr_url = COALESCE(${input.githubPrUrl ?? null}, github_pr_url),
        deployment_url = COALESCE(${input.deploymentUrl ?? null}, deployment_url),
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = ${input.buildId}
      AND status IN ('queued','running')
    RETURNING id
  `) as unknown as Array<{ id: string }>

  return Boolean(rows[0])
}
