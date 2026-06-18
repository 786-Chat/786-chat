import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = params.id

    const rows = await sql`
      SELECT id, user_id, name, template, files, created_at, updated_at
      FROM projects
      WHERE id = ${projectId}::uuid
        AND user_id = ${session.id}::uuid
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      project: rows[0],
    })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json(
      { error: "Failed to get project" },
      { status: 500 }
    )
  }
}
