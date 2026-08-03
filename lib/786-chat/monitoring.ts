import "server-only"

import { createHash, createHmac } from "node:crypto"

import { sql } from "@/lib/786-admin/db"

export type MonitoringCategory = "account" | "project" | "ai" | "build" | "deployment" | "journey" | "system"
export type MonitoringStatus = "started" | "succeeded" | "failed" | "cancelled" | "degraded"
export type MonitoringSeverity = "info" | "warning" | "error" | "critical"

type OperationalEvent = {
  category: MonitoringCategory
  eventName: string
  status: MonitoringStatus
  severity?: MonitoringSeverity
  ownerEmail?: string | null
  projectId?: string | null
  buildId?: string | null
  runId?: string | null
  errorCode?: string | null
  error?: unknown
  durationMs?: number | null
  metadata?: Record<string, unknown>
}

const SENSITIVE_KEY = /password|passcode|secret|token|cookie|authorization|api[_-]?key|credential/i

export function safeMonitoringError(error: unknown) {
  const value = error instanceof Error ? error.message : String(error || "Unknown operational failure")
  return value
    .replace(/(?:bearer\s+)?[A-Za-z0-9_-]{32,}/gi, "[redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[database connection redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 1000)
}

function safeMetadata(value: Record<string, unknown> | undefined) {
  try {
    const scrubbed = JSON.stringify(value || {}, (key, item) => {
      if (SENSITIVE_KEY.test(key)) return "[redacted]"
      if (typeof item === "string") return item.slice(0, 1000)
      return item
    })
    return JSON.parse(scrubbed) as Record<string, unknown>
  } catch {
    return { monitoringContext: "unserializable" }
  }
}

function incidentFingerprint(input: OperationalEvent) {
  return createHash("sha256")
    .update([input.category, input.eventName, input.errorCode || "unknown"].join(":"))
    .digest("hex")
}

async function sendAlert(input: {
  fingerprint: string
  category: MonitoringCategory
  title: string
  severity: MonitoringSeverity
  errorCode: string | null
  errorMessage: string
  metadata: Record<string, unknown>
}) {
  const url = process.env.ALERT_WEBHOOK_URL?.trim()
  if (!url || !/^https:\/\//i.test(url)) return { sent: false, reason: "ALERT_WEBHOOK_NOT_CONFIGURED" }
  const body = JSON.stringify({
    source: "786.chat",
    fingerprint: input.fingerprint,
    category: input.category,
    title: input.title,
    severity: input.severity,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    metadata: input.metadata,
    occurredAt: new Date().toISOString(),
  })
  const secret = process.env.ALERT_WEBHOOK_SECRET?.trim()
  const signature = secret ? createHmac("sha256", secret).update(body).digest("hex") : null
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(signature ? { "x-786-signature": signature } : {}),
      },
      body,
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    })
    return { sent: response.ok, reason: response.ok ? null : `ALERT_HTTP_${response.status}` }
  } catch (error) {
    return { sent: false, reason: safeMonitoringError(error) }
  }
}

export async function recordOperationalEvent(input: OperationalEvent) {
  const severity = input.severity || (input.status === "failed" ? "error" : "info")
  const errorMessage = input.error == null ? null : safeMonitoringError(input.error)
  const metadata = safeMetadata(input.metadata)
  const log = {
    level: severity,
    message: input.eventName,
    category: input.category,
    status: input.status,
    errorCode: input.errorCode || null,
    error: errorMessage,
    durationMs: input.durationMs == null ? null : Math.max(0, Math.floor(input.durationMs)),
    projectId: input.projectId || null,
    buildId: input.buildId || null,
    runId: input.runId || null,
  }
  const output = JSON.stringify(log)
  if (severity === "error" || severity === "critical") console.error(output)
  else if (severity === "warning") console.warn(output)
  else console.log(output)

  try {
    await sql`
      INSERT INTO builder_monitoring_events (
        category, event_name, status, severity, owner_email, project_id,
        build_id, run_id, error_code, error_message, duration_ms, metadata
      ) VALUES (
        ${input.category}, ${input.eventName.slice(0, 120)}, ${input.status}, ${severity},
        ${input.ownerEmail?.toLowerCase().trim() || null}, ${input.projectId || null},
        ${input.buildId || null}, ${input.runId || null}, ${input.errorCode?.slice(0, 100) || null},
        ${errorMessage}, ${input.durationMs == null ? null : Math.max(0, Math.floor(input.durationMs))},
        ${JSON.stringify(metadata)}::jsonb
      )
    `

    if ((severity === "error" || severity === "critical") && errorMessage) {
      const fingerprint = incidentFingerprint(input)
      const title = `${input.category}: ${input.eventName}`.slice(0, 180)
      await sql`
        INSERT INTO builder_incidents (
          fingerprint, category, title, status, severity, error_code, error_message, context
        ) VALUES (
          ${fingerprint}, ${input.category}, ${title}, 'open', ${severity},
          ${input.errorCode?.slice(0, 100) || null}, ${errorMessage}, ${JSON.stringify(metadata)}::jsonb
        )
        ON CONFLICT (fingerprint) DO UPDATE SET
          status = 'open',
          severity = EXCLUDED.severity,
          occurrence_count = builder_incidents.occurrence_count + 1,
          error_code = EXCLUDED.error_code,
          error_message = EXCLUDED.error_message,
          context = EXCLUDED.context,
          last_seen_at = NOW(),
          resolved_at = NULL,
          updated_at = NOW()
      `
      const delivery = await sendAlert({
        fingerprint,
        category: input.category,
        title,
        severity,
        errorCode: input.errorCode || null,
        errorMessage,
        metadata,
      })
      if (!delivery.sent) console.warn(JSON.stringify({ level: "warning", message: "alert_delivery_skipped", reason: delivery.reason, fingerprint }))
    }
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      message: "monitoring_persistence_failed",
      error: safeMonitoringError(error),
      originalEvent: input.eventName,
    }))
  }
}

export async function monitoringDashboard() {
  const [incidents, events, runs, summary] = await Promise.all([
    sql`SELECT * FROM builder_incidents ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'acknowledged' THEN 1 ELSE 2 END, last_seen_at DESC LIMIT 100`,
    sql`SELECT * FROM builder_monitoring_events ORDER BY created_at DESC LIMIT 150`,
    sql`SELECT * FROM builder_journey_runs ORDER BY started_at DESC LIMIT 30`,
    sql`SELECT
      COUNT(*) FILTER (WHERE status = 'open')::int AS open_incidents,
      COUNT(*) FILTER (WHERE severity = 'critical' AND status != 'resolved')::int AS critical_incidents,
      (SELECT COUNT(*)::int FROM builder_monitoring_events WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'failed') AS failures_24h,
      (SELECT COUNT(*)::int FROM builder_journey_runs WHERE started_at >= NOW() - INTERVAL '7 days' AND status = 'passed') AS journeys_passed_7d,
      (SELECT COUNT(*)::int FROM builder_journey_runs WHERE started_at >= NOW() - INTERVAL '7 days' AND status = 'failed') AS journeys_failed_7d
      FROM builder_incidents`,
  ])
  return { incidents, events, runs, summary: summary[0] || {} }
}

export async function setIncidentStatus(id: string, status: "acknowledged" | "resolved") {
  const rows = await sql`
    UPDATE builder_incidents
    SET status = ${status},
        acknowledged_at = CASE WHEN ${status} = 'acknowledged' THEN NOW() ELSE acknowledged_at END,
        resolved_at = CASE WHEN ${status} = 'resolved' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING *
  `
  return rows[0] || null
}
