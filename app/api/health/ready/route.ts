import { NextResponse } from "next/server"
import { sql } from "@/lib/786-admin/db"
import { withTimeout } from "@/lib/786-admin/reliability"

export const dynamic = "force-dynamic"

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

export async function GET() {
  const startedAt = Date.now()
  let database: "ok" | "error" = "ok"
  let databaseLatencyMs: number | null = null

  try {
    const dbStartedAt = Date.now()
    await withTimeout(sql`SELECT 1 AS healthy`, 3_000, "database readiness check")
    databaseLatencyMs = Date.now() - dbStartedAt
  } catch {
    database = "error"
  }

  const checks = {
    database,
    databaseLatencyMs,
    deepseek: configured("DEEPSEEK_API_KEY") ? "configured" : "missing",
    gemini: configured("GEMINI_API_KEY") || configured("GOOGLE_GENERATIVE_AI_API_KEY") ? "configured" : "missing",
    githubBuildToken: configured("GITHUB_BUILD_TOKEN") ? "configured" : "missing",
    buildRunnerSecret: configured("BUILD_RUNNER_SECRET") ? "configured" : "missing",
    vercelToken: configured("VERCEL_TOKEN") ? "configured" : "missing",
  } as const

  const ready =
    checks.database === "ok" &&
    checks.githubBuildToken === "configured" &&
    checks.buildRunnerSecret === "configured" &&
    checks.vercelToken === "configured" &&
    (checks.deepseek === "configured" || checks.gemini === "configured")

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "786.chat",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      checks,
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  )
}
