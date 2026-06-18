import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    const projectId = typeof body.projectId === "string" ? body.projectId : ""
    const filePath = typeof body.filePath === "string" ? body.filePath : ""
    const content = typeof body.content === "string" ? body.content : ""

    if (!projectId || !filePath) {
      return NextResponse.json(
        { error: "projectId and filePath are required" },
        { status: 400 }
      )
    }

    const rows = await sql`
      SELECT files
      FROM projects
      WHERE id = ${projectId}::uuid
        AND user_id = ${session.id}::uuid
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const currentFiles = rows[0].files || {}

    const updatedFiles = {
      ...currentFiles,
      [filePath]: content,
    }

    const updated = await sql`
      UPDATE projects
      SET files = ${JSON.stringify(updatedFiles)}::jsonb,
          updated_at = NOW()
      WHERE id = ${projectId}::uuid
        AND user_id = ${session.id}::uuid
      RETURNING id, name, template, files, updated_at
    `

    return NextResponse.json({
      success: true,
      project: updated[0],
    })
  } catch (error) {
    console.error("Update project file error:", error)
    return NextResponse.json(
      { error: "Failed to update project file" },
      { status: 500 }
    )
  }
}
