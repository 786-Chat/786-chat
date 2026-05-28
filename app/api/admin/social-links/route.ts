import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const result = await sql`
      SELECT value FROM site_content WHERE key = 'social_links'
    `
    
    if (result.length > 0) {
      return NextResponse.json({ links: result[0].value })
    }
    
    return NextResponse.json({ links: null })
  } catch (error) {
    console.error("Error fetching social links:", error)
    return NextResponse.json({ error: "Failed to fetch social links" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { links } = await request.json()
    
    await sql`
      INSERT INTO site_content (key, value, updated_at)
      VALUES ('social_links', ${JSON.stringify(links)}, NOW())
      ON CONFLICT (key) DO UPDATE 
      SET value = ${JSON.stringify(links)}, updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving social links:", error)
    return NextResponse.json({ error: "Failed to save social links" }, { status: 500 })
  }
}
