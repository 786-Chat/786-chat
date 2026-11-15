import { NextResponse } from "next/server"
import { sql } from "@/lib/786-admin/db"
import { withTimeout } from "@/lib/786-admin/reliability"
import { inspectHostingReadiness } from "@/lib/786-chat/hosting-readiness"

export const dynamic = "force-dynamic"

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

  const hosting = inspectHostingReadiness(process.env, database)
  const checks = {
    database,
    databaseLatencyMs,
    ...hosting.checks,
    hosting: hosting.hosting,
  }
  const ready = hosting.ready

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
