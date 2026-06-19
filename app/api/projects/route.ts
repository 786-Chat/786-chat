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

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rows = await sql`
      SELECT id, name, description, domain, custom_domain, status, template, files, created_at, updated_at
      FROM projects
      WHERE user_id = ${session.id}::uuid
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
