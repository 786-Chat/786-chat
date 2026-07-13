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
    await withTimeout(sql`SELECT 1 AS healthy`, 3_000, "database health check")
    databaseLatencyMs = Date.now() - dbStartedAt
  } catch {
    database = "error"
  }

  const services = {
    database,
    deepseek: configured("DEEPSEEK_API_KEY") ? "configured" : "missing",
    gemini: configured("GEMINI_API_KEY") ? "configured" : "missing",
    githubBuildToken: configured("GITHUB_BUILD_TOKEN") ? "configured" : "missing",
    buildRunnerSecret: configured("BUILD_RUNNER_SECRET") ? "configured" : "missing",
    vercelToken: configured("VERCEL_TOKEN") ? "configured" : "missing",
  } as const

  const requiredReady =
    database === "ok" &&
    services.githubBuildToken === "configured" &&
    services.buildRunnerSecret === "configured" &&
    services.vercelToken === "configured"

  const status = requiredReady ? "ready" : database === "ok" ? "degraded" : "unhealthy"
  const httpStatus = status === "unhealthy" ? 503 : 200

  return NextResponse.json(
    {
      status,
      service: "786.chat",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      checks: {
        ...services,
        databaseLatencyMs,
      },
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  )
}
