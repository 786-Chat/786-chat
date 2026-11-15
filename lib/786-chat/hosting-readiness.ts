/**
 * Hosting readiness for 786.Chat. It is intentionally conservative: a healthy
 * database alone does not mean the generated-project runtime can be used.
 *
 * These checks contain no secrets and never make external network requests.
 */
export type ServiceState = "configured" | "missing"
export type ReadinessInputs = Readonly<Record<string, string | undefined>>

function has(env: ReadinessInputs, name: string): boolean {
  return Boolean(env[name]?.trim())
}

export function inspectHostingReadiness(
  env: ReadinessInputs,
  database: "ok" | "error",
) {
  const contabo = env.CONTABO_STAGING_ONLY === "1" &&
    env.DATABASE_PROVIDER === "postgres"
  const key = (name: string): ServiceState => has(env, name) ? "configured" : "missing"
  const ai = has(env, "DEEPSEEK_API_KEY") || has(env, "GEMINI_API_KEY") ||
    has(env, "GOOGLE_GENERATIVE_AI_API_KEY")
  const jwt = Boolean(env.JWT_SECRET?.trim() && env.JWT_SECRET.trim().length >= 32)

  const common = {
    deepseek: key("DEEPSEEK_API_KEY"),
    gemini: has(env, "GEMINI_API_KEY") || has(env, "GOOGLE_GENERATIVE_AI_API_KEY")
      ? "configured" as const
      : "missing" as const,
    githubBuildToken: key("GITHUB_BUILD_TOKEN"),
    buildRunnerSecret: key("BUILD_RUNNER_SECRET"),
    vercelToken: key("VERCEL_TOKEN"),
  }
  if (!contabo) {
    const requiredReady = database === "ok" &&
      common.githubBuildToken === "configured" &&
      common.buildRunnerSecret === "configured" &&
      common.vercelToken === "configured"
    const ready = requiredReady && ai
    return {
      hosting: "vercel" as const,
      checks: common,
      requiredReady,
      ready,
    }
  }

  // Never claim Contabo is fully ready until generated-app publishing,
  // isolation, uploads and backups are independently verified.
  const coolify = key("COOLIFY_API_TOKEN")
  const coolifyOrigin = env.COOLIFY_API_URL?.trim() || ""
  let validCoolifyOrigin = false
  try {
    const url = new URL(coolifyOrigin)
    validCoolifyOrigin = url.protocol === "https:" && url.pathname === "/" &&
      !url.username && !url.password && !url.search && !url.hash
  } catch { /* unconfigured */ }

  const builderReady = common.githubBuildToken === "configured" &&
    common.buildRunnerSecret === "configured" &&
    coolify === "configured" && validCoolifyOrigin &&
    env.CONTABO_GENERATED_DEPLOYMENTS_READY === "1"
  const requiredReady = database === "ok" && jwt && builderReady
  return {
    hosting: "contabo-staging" as const,
    checks: {
      ...common,
      jwtSecret: jwt ? "configured" as const : "missing" as const,
      coolifyToken: coolify,
      coolifyApi: validCoolifyOrigin ? "configured" as const : "missing" as const,
      generatedDeployments: env.CONTABO_GENERATED_DEPLOYMENTS_READY === "1"
        ? "verified" as const : "not_verified" as const,
    },
    requiredReady,
    ready: requiredReady && ai,
  }
}
