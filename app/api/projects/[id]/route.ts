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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rows = await sql`
      SELECT id, user_id, name, description, domain, custom_domain, status, template, files, created_at, updated_at, deleted_at, delete_after
      FROM projects
      WHERE id = ${params.id}::uuid
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

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rows = await sql`
      UPDATE projects
      SET deleted_at = NOW(),
          delete_after = NOW() + INTERVAL '7 days',
          updated_at = NOW()
      WHERE id = ${params.id}::uuid
        AND user_id = ${session.id}::uuid
        AND deleted_at IS NULL
      RETURNING id
    `

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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
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

    const rows = await sql`
      UPDATE projects
      SET deleted_at = NULL,
          delete_after = NULL,
          updated_at = NOW()
      WHERE id = ${params.id}::uuid
        AND user_id = ${session.id}::uuid
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
