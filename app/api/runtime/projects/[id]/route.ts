import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

function normalizeFiles(files: unknown): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) return {}

  const output: Record<string, string> = {}

  for (const [path, value] of Object.entries(files as Record<string, unknown>)) {
    if (typeof path === "string" && typeof value === "string") {
      output[path] = value
    }
  }

  return output
}

async function getProjectId(params: { id: string } | Promise<{ id: string }>) {
  const resolvedParams = await Promise.resolve(params)
  return String(resolvedParams.id || "")
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || ""
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ""
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const runtimeToken = process.env.RUNTIME_WORKER_TOKEN?.trim() || ""

    if (!runtimeToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Runtime worker token is not configured",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      )
    }

    const providedToken = getBearerToken(request)

    if (!providedToken || providedToken !== runtimeToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized runtime request" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      )
    }

    const projectId = await getProjectId(params)

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project id is required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      )
    }

    const rows = await sql`
      SELECT id, user_id, name, template, files, created_at, updated_at
      FROM projects
      WHERE id = ${projectId}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      )
    }

    const project = rows[0]

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          user_id: project.user_id,
          name: project.name || "AI Project",
          template: project.template || "custom",
          files: normalizeFiles(project.files),
          created_at: project.created_at,
          updated_at: project.updated_at,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Runtime project fetch error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load runtime project",
        debug: error instanceof Error ? error.message : "Unknown runtime project error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
