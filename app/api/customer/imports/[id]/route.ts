import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sql`
      SELECT 
        id,
        import_type,
        source_url,
        source_provider,
        import_status,
        preview_url,
        admin_notes,
        notes,
        original_content,
        uploaded_files,
        created_at,
        processed_at,
        published_at
      FROM website_imports
      WHERE id = ${id} AND user_id = ${session.id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 })
    }

    return NextResponse.json({ import: result[0] })
  } catch (error) {
    console.error("Error fetching import:", error)
    return NextResponse.json({ error: "Failed to fetch import" }, { status: 500 })
  }
}
