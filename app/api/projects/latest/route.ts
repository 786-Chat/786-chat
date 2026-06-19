import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

function normalizeFiles(files: unknown): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) {
    return {}
  }

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
      SELECT id, user_id, name, template, files, created_at, updated_at
      FROM projects
      WHERE user_id = ${session.id}::uuid
      ORDER BY updated_at DESC
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json(
        { success: true, project: null },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      )
    }

    const project = rows[0]

    return NextResponse.json(
      {
        success: true,
        project: {
          ...project,
          files: normalizeFiles(project.files),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  } catch (error) {
    console.error("Latest project error:", error)
    return NextResponse.json(
      { error: "Failed to load latest project" },
      { status: 500 }
    )
  }
}
