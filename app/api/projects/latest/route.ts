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
      SELECT id, name, files, created_at, updated_at
      FROM projects
      WHERE user_id = ${session.id}::uuid
      ORDER BY updated_at DESC
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json(
        { success: true, project: null },
        { headers: { "Cache-Control": "no-store" } }
      )
    }

    return NextResponse.json(
      {
        success: true,
        project: {
          id: rows[0].id,
          name: rows[0].name || "AI Project",
          files: normalizeFiles(rows[0].files),
          created_at: rows[0].created_at,
          updated_at: rows[0].updated_at,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Latest project error:", error)

    return NextResponse.json(
      {
        success: true,
        project: null,
        debug:
          error instanceof Error
            ? error.message
            : "Unknown latest project error",
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  }
}
