import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const categories = await sql`
      SELECT 
        tc.*,
        COUNT(t.id) as theme_count
      FROM theme_categories tc
      LEFT JOIN themes t ON t.category_id = tc.id AND t.is_active = true
      GROUP BY tc.id
      ORDER BY tc.name ASC
    `

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories", categories: [] }, { status: 500 })
  }
}
