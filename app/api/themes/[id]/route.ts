import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Try to find by slug first, then by id
    const themes = await sql`
      SELECT 
        t.*,
        tc.name as category_name,
        tc.slug as category_slug
      FROM themes t
      LEFT JOIN theme_categories tc ON t.category_id = tc.id
      WHERE (t.slug = ${id} OR t.id::text = ${id}) AND t.is_active = true
      LIMIT 1
    `

    if (themes.length === 0) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    const theme = themes[0]

    // Get reviews for this theme
    const reviews = await sql`
      SELECT 
        r.*,
        u.name as user_name
      FROM theme_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.theme_id = ${theme.id}
      ORDER BY r.created_at DESC
      LIMIT 10
    `

    return NextResponse.json({ theme, reviews })
  } catch (error) {
    console.error("Error fetching theme:", error)
    return NextResponse.json({ error: "Failed to fetch theme" }, { status: 500 })
  }
}
