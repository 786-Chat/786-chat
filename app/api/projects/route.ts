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

export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get("includeDeleted") === "true"

    const rows = includeDeleted
      ? await sql`
          SELECT id, name, description, domain, custom_domain, status, template, files, created_at, updated_at, deleted_at, delete_after
          FROM projects
          WHERE user_id = ${session.id}::uuid
            AND deleted_at IS NOT NULL
            AND (delete_after IS NULL OR delete_after > NOW())
          ORDER BY deleted_at DESC, updated_at DESC NULLS LAST, created_at DESC
        `
      : await sql`
          SELECT id, name, description, domain, custom_domain, status, template, files, created_at, updated_at, deleted_at, delete_after
          FROM projects
          WHERE user_id = ${session.id}::uuid
            AND deleted_at IS NULL
          ORDER BY updated_at DESC NULLS LAST, created_at DESC
        `

    return NextResponse.json(
      {
        success: true,
        projects: rows.map((row) => {
          const files = normalizeFiles(row.files)
          return {
            id: row.id,
            name: row.name || "AI Project",
            description: row.description || "",
            domain: row.domain || null,
            custom_domain: row.custom_domain || null,
            status: row.status || "active",
            template: row.template || "custom",
            files,
            fileCount: Object.keys(files).length,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
            delete_after: row.delete_after,
          }
        }),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("List projects error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to list projects",
        debug: error instanceof Error ? error.message : "Unknown projects error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
