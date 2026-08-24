import { NextRequest, NextResponse } from "next/server"

import { isAdminUser } from "@/lib/admin-config"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

type RiskSignal = { label: string; severity: "review" | "high" }

type ProjectListItem = {
  id: string
  source: "builder" | "legacy"
  name: string
  description: string
  owner_email: string
  user_id: string | null
  customer_name: string | null
  account_status: string | null
  email_verified: boolean | null
  status: string
  template: string
  file_count: number
  message_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  risk_text?: string
}

const REVIEW_RULES: Array<{ label: string; severity: "review" | "high"; pattern: RegExp }> = [
  {
    label: "Credential or phishing language",
    severity: "high",
    pattern: /\b(phish(?:ing)?|credential\s+harvest|steal\s+(?:password|credential)|fake\s+login|clone\s+(?:bank|payment)\s+login)\b/i,
  },
  {
    label: "Malware or unauthorized-access language",
    severity: "high",
    pattern: /\b(ransomware|keylogger|malware|botnet|credential\s+stuffing|ddos|bypass\s+authentication|steal\s+session|session\s+hijack)\b/i,
  },
  {
    label: "Fraud or bulk-spam language",
    severity: "review",
    pattern: /\b(carding|stolen\s+card|bulk\s+spam|spam\s+campaign|fake\s+invoice|mass\s+unsolicited|impersonat(?:e|ion)\s+(?:bank|support|customer))\b/i,
  },
]

function reviewSignals(text: string): RiskSignal[] {
  const normalized = String(text || "").slice(0, 40_000)
  return REVIEW_RULES.filter((rule) => rule.pattern.test(normalized)).map(({ label, severity }) => ({ label, severity }))
}

async function requireAdmin() {
  const session = await getSession()
  if (!session) return { error: "Unauthorized", status: 401 as const }
  if (session.role !== "admin" && !isAdminUser(session.email)) {
    return { error: "Forbidden", status: 403 as const }
  }
  return { session }
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

async function loadBuilderDetail(id: string) {
  const rows = (await sql`
    SELECT
      p.id, p.title, p.description, p.prompt, p.kind, p.preview_state, p.metadata,
      p.owner_email, p.created_at, p.updated_at,
      u.id AS user_id, u.name AS customer_name, u.account_status, u.email_verified,
      COALESCE((SELECT COUNT(*) FROM admin_project_files f WHERE f.project_id = p.id), 0)::int AS file_count,
      COALESCE((SELECT COUNT(*) FROM admin_project_messages m WHERE m.project_id = p.id), 0)::int AS message_count,
      COALESCE((SELECT COUNT(*) FROM admin_project_revisions r WHERE r.project_id = p.id), 0)::int AS revision_count
    FROM admin_projects p
    LEFT JOIN users u ON LOWER(u.email) = LOWER(p.owner_email)
    WHERE p.id = ${id}::uuid
    LIMIT 1
  `) as unknown as Array<Record<string, unknown>>

  const project = rows[0]
  if (!project) return null

  const messages = (await sql`
    SELECT id, role, LEFT(content, 4000) AS content, model, reason, created_at
    FROM admin_project_messages
    WHERE project_id = ${id}::uuid
    ORDER BY created_at DESC, id DESC
    LIMIT 30
  `) as unknown as Array<Record<string, unknown>>

  const revisions = (await sql`
    SELECT id, label, source, created_at
    FROM admin_project_revisions
    WHERE project_id = ${id}::uuid
    ORDER BY created_at DESC
    LIMIT 20
  `) as unknown as Array<Record<string, unknown>>

  let generations: Array<Record<string, unknown>> = []
  let builds: Array<Record<string, unknown>> = []

  try {
    generations = (await sql`
      SELECT id, status, provider, created_at, completed_at
      FROM builder_generation_jobs
      WHERE project_id = ${id}::uuid
      ORDER BY created_at DESC
      LIMIT 20
    `) as unknown as Array<Record<string, unknown>>
  } catch (error) {
    console.warn("[786.Chat] Optional generation history unavailable", error)
  }

  try {
    builds = (await sql`
      SELECT id, status, github_branch, github_commit_sha, github_pr_url,
             deployment_url, repair_attempt, repair_status, error_message,
             created_at, completed_at
      FROM admin_project_builds
      WHERE project_id = ${id}::uuid
      ORDER BY created_at DESC
      LIMIT 20
    `) as unknown as Array<Record<string, unknown>>
  } catch (error) {
    console.warn("[786.Chat] Optional build history unavailable", error)
  }

  const activityText = [
    String(project.prompt || ""),
    ...messages.filter((message) => message.role === "user").map((message) => String(message.content || "")),
  ].join("\n")

  return {
    source: "builder" as const,
    project: {
      ...project,
      name: String(project.title || "AI Project"),
      status: "active",
      template: String(project.kind || "786chat"),
      file_count: numberValue(project.file_count),
      message_count: numberValue(project.message_count),
      revision_count: numberValue(project.revision_count),
    },
    signals: reviewSignals(activityText),
    messages,
    revisions,
    generations,
    builds,
  }
}

async function loadLegacyDetail(id: string) {
  const rows = (await sql`
    SELECT
      p.id, p.name, p.description, p.domain, p.custom_domain, p.status, p.template,
      p.created_at, p.updated_at, p.deleted_at, p.delete_after,
      u.id AS user_id, u.name AS customer_name, u.email AS owner_email,
      u.account_status, u.email_verified,
      COALESCE((SELECT COUNT(*) FROM jsonb_each(COALESCE(p.files, '{}'::jsonb))), 0)::int AS file_count
    FROM projects p
    INNER JOIN users u ON u.id = p.user_id
    WHERE p.id = ${id}::uuid
    LIMIT 1
  `) as unknown as Array<Record<string, unknown>>

  const project = rows[0]
  if (!project) return null

  let activity: Array<Record<string, unknown>> = []
  try {
    activity = (await sql`
      SELECT action, tokens_used, estimated_cost_gbp, created_at
      FROM usage_logs
      WHERE user_id = ${String(project.user_id)}::uuid
      ORDER BY created_at DESC
      LIMIT 25
    `) as unknown as Array<Record<string, unknown>>
  } catch (error) {
    console.warn("[786.Chat] Optional user activity unavailable", error)
  }

  return {
    source: "legacy" as const,
    project: {
      ...project,
      message_count: 0,
      revision_count: 0,
      file_count: numberValue(project.file_count),
    },
    signals: [] as RiskSignal[],
    messages: [],
    revisions: [],
    generations: [],
    builds: [],
    activity,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const searchParams = request.nextUrl.searchParams
    const id = String(searchParams.get("id") || "").trim()
    const source = String(searchParams.get("source") || "builder").trim()

    if (id) {
      const detail = source === "legacy" ? await loadLegacyDetail(id) : await loadBuilderDetail(id)
      if (!detail) return NextResponse.json({ error: "Project not found" }, { status: 404 })
      return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } })
    }

    const builderRows = (await sql`
      SELECT
        p.id,
        'builder'::text AS source,
        p.title AS name,
        p.description,
        p.owner_email,
        u.id AS user_id,
        u.name AS customer_name,
        u.account_status,
        u.email_verified,
        'active'::text AS status,
        p.kind AS template,
        COALESCE((SELECT COUNT(*) FROM admin_project_files f WHERE f.project_id = p.id), 0)::int AS file_count,
        COALESCE((SELECT COUNT(*) FROM admin_project_messages m WHERE m.project_id = p.id), 0)::int AS message_count,
        p.created_at,
        p.updated_at,
        NULL::timestamptz AS deleted_at,
        COALESCE((
          SELECT string_agg(recent.content, ' ')
          FROM (
            SELECT LEFT(m.content, 1200) AS content
            FROM admin_project_messages m
            WHERE m.project_id = p.id AND m.role = 'user'
            ORDER BY m.created_at DESC
            LIMIT 12
          ) recent
        ), '') || ' ' || COALESCE(p.prompt, '') AS risk_text
      FROM admin_projects p
      LEFT JOIN users u ON LOWER(u.email) = LOWER(p.owner_email)
      ORDER BY p.updated_at DESC
      LIMIT 1000
    `) as unknown as ProjectListItem[]

    let legacyRows: ProjectListItem[] = []
    try {
      legacyRows = (await sql`
        SELECT
          p.id,
          'legacy'::text AS source,
          p.name,
          p.description,
          u.email AS owner_email,
          u.id AS user_id,
          u.name AS customer_name,
          u.account_status,
          u.email_verified,
          COALESCE(p.status, 'active') AS status,
          COALESCE(p.template, 'custom') AS template,
          COALESCE((SELECT COUNT(*) FROM jsonb_each(COALESCE(p.files, '{}'::jsonb))), 0)::int AS file_count,
          0::int AS message_count,
          p.created_at,
          p.updated_at,
          p.deleted_at,
          ''::text AS risk_text
        FROM projects p
        INNER JOIN users u ON u.id = p.user_id
        ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
        LIMIT 1000
      `) as unknown as ProjectListItem[]
    } catch (error) {
      console.warn("[786.Chat] Legacy project list unavailable", error)
    }

    const projects = [...builderRows, ...legacyRows]
      .map((project) => ({
        ...project,
        file_count: numberValue(project.file_count),
        message_count: numberValue(project.message_count),
        signals: reviewSignals(project.risk_text || ""),
        risk_text: undefined,
      }))
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())

    const stats = {
      total_projects: projects.length,
      customers: new Set(projects.map((project) => project.owner_email).filter(Boolean)).size,
      review_suggested: projects.filter((project) => project.signals.length > 0).length,
      updated_24h: projects.filter((project) => Date.now() - new Date(project.updated_at || project.created_at).getTime() <= 24 * 60 * 60 * 1000).length,
    }

    return NextResponse.json({ projects, stats }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[786.Chat] Admin projects GET failed", error)
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 })
  }
}
