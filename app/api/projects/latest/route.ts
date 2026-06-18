import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

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
      return NextResponse.json({ project: null })
    }

    return NextResponse.json({
      success: true,
      project: rows[0],
    })
  } catch (error) {
    console.error("Latest project error:", error)
    return NextResponse.json(
      { error: "Failed to load latest project" },
      { status: 500 }
    )
  }
}
