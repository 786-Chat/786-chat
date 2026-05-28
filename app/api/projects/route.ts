import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getSql } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getSql()
    const projects = await sql`
      SELECT * FROM projects 
      WHERE user_id = ${session.id} 
      ORDER BY is_default DESC, created_at DESC
    `

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()
    const sql = getSql()

    // Check if user has any projects - if not, make this one default
    const existingProjects = await sql`
      SELECT COUNT(*) as count FROM projects WHERE user_id = ${session.id}
    `
    const isDefault = existingProjects[0].count === 0

    const project = await sql`
      INSERT INTO projects (user_id, name, description, is_default)
      VALUES (${session.id}, ${name}, ${description || null}, ${isDefault})
      RETURNING *
    `

    return NextResponse.json({ project: project[0] })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
