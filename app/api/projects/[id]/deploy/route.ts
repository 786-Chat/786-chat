import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_FILE_COUNT = 250
const MAX_TOTAL_BYTES = 8_000_000

const NO_STORE = { "Cache-Control": "no-store" }

type RouteParams = { id: string } | Promise<{ id: string }>
type ProjectFiles = Record<string, string>

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

function normalizeFiles(value: unknown): ProjectFiles {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([path, content]) =>
        typeof path === "string" &&
        typeof content === "string" &&
        path.length > 0 &&
        path.length <= 240 &&
        !path.startsWith("/") &&
        !path.includes("..") &&
        !path.includes("\\")
    )
  ) as ProjectFiles
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "786-chat-project"
}

async function resolveProjectContext(params: RouteParams) {
  const session = await getSession()
  if (!session?.id) return { response: json({ error: "Unauthorized" }, 401) }

  const resolved = await Promise.resolve(params)
  const projectId = String(resolved.id || "").trim()
  if (!UUID_PATTERN.test(projectId)) {
    return { response: json({ error: "Invalid project id" }, 400) }
  }

  const rows = await sql`
    SELECT id, name, files
    FROM projects
    WHERE id = ${projectId}::uuid
      AND user_id = ${session.id}::uuid
      AND deleted_at IS NULL
    LIMIT 1
  `

  if (!rows.length) return { response: json({ error: "Project not found" }, 404) }
  return { session, projectId, project: rows[0] }
}

async function ensureDeploymentSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS project_deployments (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      provider TEXT NOT NULL DEFAULT 'vercel',
      provider_deployment_id TEXT,
      deployment_url TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      error_message TEXT,
      file_count INTEGER NOT NULL DEFAULT 0,
      total_bytes BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_project_deployments_owner_project_created
      ON project_deployments (user_id, project_id, created_at DESC)
  `
}

export async function GET(_request: Request, { params }: { params: RouteParams }) {
  const context = await resolveProjectContext(params)
  if ("response" in context) return context.response

  await ensureDeploymentSchema()
  const deployments = await sql`
    SELECT id, provider, provider_deployment_id, deployment_url, status,
           error_message, file_count, total_bytes, created_at, updated_at
    FROM project_deployments
    WHERE project_id = ${context.projectId}::uuid
      AND user_id = ${context.session.id}::uuid
    ORDER BY created_at DESC
    LIMIT 50
  `

  return json({ success: true, deployments })
}

export async function POST(_request: Request, { params }: { params: RouteParams }) {
  const context = await resolveProjectContext(params)
  if ("response" in context) return context.response

  const token = process.env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_TOKEN || ""
  if (!token) {
    return json(
      {
        error: "VERCEL_NOT_CONFIGURED",
        message: "Project publishing requires VERCEL_ACCESS_TOKEN in Vercel environment variables.",
      },
      503
    )
  }

  const files = normalizeFiles(context.project.files)
  const entries = Object.entries(files)
  if (!entries.length) return json({ error: "Project has no files to deploy" }, 400)
  if (entries.length > MAX_FILE_COUNT) return json({ error: "Project contains too many files" }, 400)

  const totalBytes = entries.reduce((total, [, content]) => total + Buffer.byteLength(content, "utf8"), 0)
  if (totalBytes > MAX_TOTAL_BYTES) return json({ error: "Project is too large to deploy" }, 400)

  await ensureDeploymentSchema()
  const historyId = randomUUID()
  await sql`
    INSERT INTO project_deployments (
      id, project_id, user_id, provider, status, file_count, total_bytes
    ) VALUES (
      ${historyId}, ${context.projectId}::uuid, ${context.session.id}::uuid,
      'vercel', 'queued', ${entries.length}, ${totalBytes}
    )
  `

  const teamId = process.env.VERCEL_TEAM_ID || ""
  const endpoint = new URL("https://api.vercel.com/v13/deployments")
  if (teamId) endpoint.searchParams.set("teamId", teamId)

  const projectName = slugify(String(context.project.name || `project-${context.projectId.slice(0, 8)}`))

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        target: "production",
        files: entries.map(([file, data]) => ({ file, data, encoding: "utf-8" })),
        projectSettings: {
          framework: "nextjs",
          buildCommand: "npm run build",
          installCommand: "npm install",
        },
      }),
      cache: "no-store",
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data?.error?.message || data?.message || "Vercel deployment failed"
      await sql`
        UPDATE project_deployments
        SET status = 'failed', error_message = ${String(message).slice(0, 2000)}, updated_at = NOW()
        WHERE id = ${historyId}::uuid
          AND project_id = ${context.projectId}::uuid
          AND user_id = ${context.session.id}::uuid
      `
      return json({ error: "DEPLOYMENT_FAILED", message, deploymentHistoryId: historyId }, response.status)
    }

    const deploymentUrl = data?.url ? `https://${String(data.url).replace(/^https?:\/\//, "")}` : ""
    const deploymentId = data?.id ? String(data.id) : ""
    const readyState = String(data?.readyState || data?.status || "QUEUED").toLowerCase()

    await sql`
      UPDATE project_deployments
      SET provider_deployment_id = ${deploymentId || null},
          deployment_url = ${deploymentUrl || null},
          status = ${readyState},
          updated_at = NOW()
      WHERE id = ${historyId}::uuid
        AND project_id = ${context.projectId}::uuid
        AND user_id = ${context.session.id}::uuid
    `

    await sql`
      UPDATE projects
      SET domain = ${deploymentUrl || null},
          status = ${readyState === "ready" ? "deployed" : "deploying"},
          updated_at = NOW()
      WHERE id = ${context.projectId}::uuid
        AND user_id = ${context.session.id}::uuid
        AND deleted_at IS NULL
    `

    return json({
      success: true,
      deployment: {
        id: deploymentId,
        historyId,
        url: deploymentUrl,
        readyState: data?.readyState || data?.status || "QUEUED",
      },
    })
  } catch (error) {
    console.error("Project deployment error:", error)
    await sql`
      UPDATE project_deployments
      SET status = 'failed',
          error_message = 'Could not contact Vercel deployment service',
          updated_at = NOW()
      WHERE id = ${historyId}::uuid
        AND project_id = ${context.projectId}::uuid
        AND user_id = ${context.session.id}::uuid
    `
    return json(
      {
        error: "DEPLOYMENT_FAILED",
        message: "Could not contact Vercel deployment service",
        deploymentHistoryId: historyId,
      },
      502
    )
  }
}
