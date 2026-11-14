/**
 * 786.Chat: provision a generated-project Coolify resource in isolated staging.
 *
 * This does NOT deploy, publish DNS, touch live applications, or modify databases.
 * Use only after the corresponding generated app's runtime (Postgres, uploads,
 * authentication, etc.) has passed its migration and security checks.
 *
 * API: https://coolify.io/docs/api/endpoints/applications/create-public-application
 */
export type CoolifyStagingApplication = { uuid: string }
export type CoolifyStagingConfig = {
  apiOrigin: string
  apiToken: string
  projectUuid: string
  serverUuid: string
  environmentName: string
  repository: string
  branch: string
  commitSha: string
  generatedProjectId: string
}

export function coolifyStagingPayload(config: CoolifyStagingConfig) {
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(config.generatedProjectId)) {
    throw new Error("Invalid generated project identifier")
  }
  if (!/^[a-zA-Z0-9._/-]{1,150}$/.test(config.branch) || config.branch.startsWith("/") || config.branch.includes("..")) {
    throw new Error("Unsafe Git branch")
  }
  if (!/^[a-f0-9]{40}$/i.test(config.commitSha)) {
    throw new Error("Expected an exact 40-character Git commit SHA")
  }
  if (!/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?$/.test(config.repository)) {
    throw new Error("Staging requires an explicitly configured GitHub repository")
  }
  for (const key of ["projectUuid", "serverUuid", "environmentName"] as const) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(config[key])) {
      throw new Error(`Invalid Coolify ${key}`)
    }
  }
  return {
    project_uuid: config.projectUuid,
    server_uuid: config.serverUuid,
    environment_name: config.environmentName,
    git_repository: config.repository,
    git_branch: config.branch,
    git_commit_sha: config.commitSha,
    build_pack: "railpack" as const,
    ports_exposes: "3000",
    base_directory: `generated-projects/${config.generatedProjectId}`,
    name: `786-staging-${config.generatedProjectId.slice(0, 12)}`,
    is_auto_deploy_enabled: false,
    is_preview_deployments_enabled: false,
    instant_deploy: false,
    is_force_https_enabled: true,
  }
}

/**
 * Staging-only provision request. Caller must provide a secure, authenticated
 * Coolify API origin; this function never triggers the deploy endpoint.
 */
export async function createCoolifyStagingApplication(
  config: CoolifyStagingConfig,
  request: typeof fetch = fetch,
): Promise<CoolifyStagingApplication> {
  if (process.env.CONTABO_STAGING_ONLY !== "1" || process.env.DATABASE_PROVIDER !== "postgres") {
    throw new Error("Coolify staging provisioning requires explicit staging environment flags")
  }
  const origin = new URL(config.apiOrigin)
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") {
    throw new Error("Coolify API origin must use HTTPS without embedded credentials or a path")
  }
  if (!config.apiToken || config.apiToken.length < 12) throw new Error("Missing private Coolify API token")

  const payload = coolifyStagingPayload(config)
  const response = await request(new URL("/api/v1/applications/public", origin), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    // No raw server response here: it could contain user secrets.
    throw new Error(`Coolify staging resource creation failed (HTTP ${response.status})`)
  }
  const body = (await response.json()) as { uuid?: unknown }
  if (typeof body.uuid !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(body.uuid)) {
    throw new Error("Coolify returned an invalid application UUID")
  }
  return { uuid: body.uuid }
}
