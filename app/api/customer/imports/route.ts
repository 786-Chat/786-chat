import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
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
        created_at,
        processed_at
      FROM website_imports
      WHERE user_id = ${session.id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ imports: result })
  } catch (error) {
    console.error("Error fetching imports:", error)
    return NextResponse.json({ error: "Failed to fetch imports" }, { status: 500 })
  }
}
