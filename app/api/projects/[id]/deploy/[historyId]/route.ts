import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const NO_STORE = { "Cache-Control": "no-store" }

type RouteParams =
  | { id: string; historyId: string }
  | Promise<{ id: string; historyId: string }>

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

function normalizeStatus(value: unknown) {
  const status = String(value || "queued").toLowerCase()
  if (["ready", "error", "canceled", "cancelled", "failed"].includes(status)) return status
  if (["building", "initializing", "queued"].includes(status)) return status
  return "queued"
}

function projectStatusFor(deploymentStatus: string) {
  if (deploymentStatus === "ready") return "deployed"
  if (["error", "failed", "canceled", "cancelled"].includes(deploymentStatus)) return "deployment_failed"
  return "deploying"
}

export async function GET(_request: Request, { params }: { params: RouteParams }) {
  const session = await getSession()
  if (!session?.id) return json({ error: "Unauthorized" }, 401)

  const resolved = await Promise.resolve(params)
  const projectId = String(resolved.id || "").trim()
  const historyId = String(resolved.historyId || "").trim()
  if (!UUID_PATTERN.test(projectId) || !UUID_PATTERN.test(historyId)) {
    return json({ error: "Invalid deployment id" }, 400)
  }

  const rows = await sql`
    SELECT id, provider_deployment_id, deployment_url, status, error_message,
           created_at, updated_at
    FROM project_deployments
    WHERE id = ${historyId}::uuid
      AND project_id = ${projectId}::uuid
      AND user_id = ${session.id}::uuid
    LIMIT 1
  `

  if (!rows.length) return json({ error: "Deployment not found" }, 404)

  const deployment = rows[0]
  const currentStatus = normalizeStatus(deployment.status)
  const isFinal = ["ready", "error", "failed", "canceled", "cancelled"].includes(currentStatus)
  if (isFinal || !deployment.provider_deployment_id) {
    return json({ success: true, deployment: { ...deployment, status: currentStatus } })
  }

  const token = process.env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_TOKEN || ""
  if (!token) {
    return json({
      success: true,
      deployment: { ...deployment, status: currentStatus },
      warning: "VERCEL_NOT_CONFIGURED",
    })
  }

  const teamId = process.env.VERCEL_TEAM_ID || ""
  const endpoint = new URL(
    `https://api.vercel.com/v13/deployments/${encodeURIComponent(String(deployment.provider_deployment_id))}`
  )
  if (teamId) endpoint.searchParams.set("teamId", teamId)

  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = String(data?.error?.message || data?.message || "Could not read deployment status")
      return json({
        success: true,
        deployment: { ...deployment, status: currentStatus },
        warning: message,
      })
    }

    const nextStatus = normalizeStatus(data?.readyState || data?.status)
    const nextUrl = data?.url
      ? `https://${String(data.url).replace(/^https?:\/\//, "")}`
      : String(deployment.deployment_url || "")
    const errorMessage = ["error", "failed", "canceled", "cancelled"].includes(nextStatus)
      ? String(data?.errorMessage || data?.error?.message || "Deployment failed").slice(0, 2000)
      : null

    await sql`
      UPDATE project_deployments
      SET status = ${nextStatus},
          deployment_url = ${nextUrl || null},
          error_message = ${errorMessage},
          updated_at = NOW()
      WHERE id = ${historyId}::uuid
        AND project_id = ${projectId}::uuid
        AND user_id = ${session.id}::uuid
    `

    await sql`
      UPDATE projects
      SET domain = CASE WHEN ${nextStatus} = 'ready' THEN ${nextUrl || null} ELSE domain END,
          status = ${projectStatusFor(nextStatus)},
          updated_at = NOW()
      WHERE id = ${projectId}::uuid
        AND user_id = ${session.id}::uuid
        AND deleted_at IS NULL
    `

    return json({
      success: true,
      deployment: {
        id: historyId,
        provider_deployment_id: deployment.provider_deployment_id,
        deployment_url: nextUrl,
        status: nextStatus,
        error_message: errorMessage,
      },
    })
  } catch (error) {
    console.error("Deployment status error:", error)
    return json({
      success: true,
      deployment: { ...deployment, status: currentStatus },
      warning: "Could not contact Vercel deployment service",
    })
  }
}
