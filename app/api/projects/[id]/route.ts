import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = await getProjectId(params)

    const rows = await sql`
      SELECT id, user_id, name, description, domain, custom_domain, status, template, files, created_at, updated_at, deleted_at, delete_after
      FROM projects
      WHERE id = ${projectId}::uuid
        AND user_id = ${session.id}::uuid
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = rows[0]
    const files = normalizeFiles(project.files)

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          user_id: project.user_id,
          name: project.name || "AI Project",
          description: project.description || "",
          domain: project.domain || null,
          custom_domain: project.custom_domain || null,
          status: project.status || "active",
          template: project.template || "custom",
          files,
          fileCount: Object.keys(files).length,
          created_at: project.created_at,
          updated_at: project.updated_at,
          deleted_at: project.deleted_at,
          delete_after: project.delete_after,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json(
      {
        error: "Failed to get project",
        debug: error instanceof Error ? error.message : "Unknown project error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}

async function softDeleteProject(projectId: string, userId: string) {
  return sql`
    UPDATE projects
    SET deleted_at = NOW(),
        delete_after = NOW() + INTERVAL '7 days',
        updated_at = NOW()
    WHERE id = ${projectId}::uuid
      AND user_id = ${userId}::uuid
      AND deleted_at IS NULL
    RETURNING id
  `
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = await getProjectId(params)
    const rows = await softDeleteProject(projectId, session.id)

    if (!rows.length) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(
      { success: true, deleted: true },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete project",
        debug: error instanceof Error ? error.message : "Unknown delete project error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const projectId = await getProjectId(params)

    if (body?.action === "delete") {
      const rows = await softDeleteProject(projectId, session.id)

      if (!rows.length) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      return NextResponse.json(
        { success: true, deleted: true },
        { headers: { "Cache-Control": "no-store" } }
      )
    }

    if (body?.action === "restore") {
      return restoreProject(projectId, session.id)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Project action error:", error)
    return NextResponse.json(
      {
        error: "Failed to update project",
        debug: error instanceof Error ? error.message : "Unknown project action error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}

async function restoreProject(projectId: string, userId: string) {
  const rows = await sql`
    UPDATE projects
    SET deleted_at = NULL,
        delete_after = NULL,
        updated_at = NOW()
    WHERE id = ${projectId}::uuid
      AND user_id = ${userId}::uuid
      AND deleted_at IS NOT NULL
      AND (delete_after IS NULL OR delete_after > NOW())
    RETURNING id
  `

  if (!rows.length) {
    return NextResponse.json(
      { error: "Project not found or recovery period expired" },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { success: true, restored: true },
    { headers: { "Cache-Control": "no-store" } }
  )
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    if (body?.action !== "restore") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const projectId = await getProjectId(params)
    return restoreProject(projectId, session.id)
  } catch (error) {
    console.error("Restore project error:", error)
    return NextResponse.json(
      {
        error: "Failed to restore project",
        debug: error instanceof Error ? error.message : "Unknown restore project error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
