import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_FILE_COUNT = 250
const MAX_TOTAL_BYTES = 8_000_000

type RouteParams = { id: string } | Promise<{ id: string }>

type ProjectFiles = Record<string, string>

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
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

export async function POST(_request: Request, { params }: { params: RouteParams }) {
  const session = await getSession()
  if (!session?.id) return json({ error: "Unauthorized" }, 401)

  const resolved = await Promise.resolve(params)
  const projectId = String(resolved.id || "").trim()
  if (!UUID_PATTERN.test(projectId)) return json({ error: "Invalid project id" }, 400)

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

  const rows = await sql`
    SELECT id, name, files
    FROM projects
    WHERE id = ${projectId}::uuid
      AND user_id = ${session.id}::uuid
      AND deleted_at IS NULL
    LIMIT 1
  `

  if (!rows.length) return json({ error: "Project not found" }, 404)

  const files = normalizeFiles(rows[0].files)
  const entries = Object.entries(files)
  if (!entries.length) return json({ error: "Project has no files to deploy" }, 400)
  if (entries.length > MAX_FILE_COUNT) return json({ error: "Project contains too many files" }, 400)

  const totalBytes = entries.reduce((total, [, content]) => total + Buffer.byteLength(content, "utf8"), 0)
  if (totalBytes > MAX_TOTAL_BYTES) return json({ error: "Project is too large to deploy" }, 400)

  const teamId = process.env.VERCEL_TEAM_ID || ""
  const endpoint = new URL("https://api.vercel.com/v13/deployments")
  if (teamId) endpoint.searchParams.set("teamId", teamId)

  const projectName = slugify(String(rows[0].name || `project-${projectId.slice(0, 8)}`))

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
      return json({ error: "DEPLOYMENT_FAILED", message }, response.status)
    }

    const deploymentUrl = data?.url ? `https://${String(data.url).replace(/^https?:\/\//, "")}` : ""
    const deploymentId = data?.id ? String(data.id) : ""

    await sql`
      UPDATE projects
      SET domain = ${deploymentUrl || null},
          status = 'deploying',
          updated_at = NOW()
      WHERE id = ${projectId}::uuid
        AND user_id = ${session.id}::uuid
        AND deleted_at IS NULL
    `

    return json({
      success: true,
      deployment: {
        id: deploymentId,
        url: deploymentUrl,
        readyState: data?.readyState || data?.status || "QUEUED",
      },
    })
  } catch (error) {
    console.error("Project deployment error:", error)
    return json({ error: "DEPLOYMENT_FAILED", message: "Could not contact Vercel deployment service" }, 502)
  }
}
