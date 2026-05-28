import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const featured = searchParams.get("featured")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") || "newest"

    let themes
    
    if (category && category !== "all") {
      themes = await sql`
        SELECT 
          t.*,
          tc.name as category_name,
          tc.slug as category_slug
        FROM themes t
        LEFT JOIN theme_categories tc ON t.category_id = tc.id
        WHERE t.is_active = true AND tc.slug = ${category}
        ORDER BY 
          CASE WHEN ${sort} = 'newest' THEN t.created_at END DESC,
          CASE WHEN ${sort} = 'popular' THEN t.sales_count END DESC,
          CASE WHEN ${sort} = 'price-low' THEN t.price_cents END ASC,
          CASE WHEN ${sort} = 'price-high' THEN t.price_cents END DESC,
          CASE WHEN ${sort} = 'rating' THEN t.rating_avg END DESC
      `
    } else if (featured === "true") {
      themes = await sql`
        SELECT 
          t.*,
          tc.name as category_name,
          tc.slug as category_slug
        FROM themes t
        LEFT JOIN theme_categories tc ON t.category_id = tc.id
        WHERE t.is_active = true AND t.is_featured = true
        ORDER BY t.sales_count DESC
        LIMIT 6
      `
    } else if (search) {
      const searchTerm = `%${search}%`
      themes = await sql`
        SELECT 
          t.*,
          tc.name as category_name,
          tc.slug as category_slug
        FROM themes t
        LEFT JOIN theme_categories tc ON t.category_id = tc.id
        WHERE t.is_active = true AND (
          t.name ILIKE ${searchTerm} OR 
          t.description ILIKE ${searchTerm} OR
          tc.name ILIKE ${searchTerm}
        )
        ORDER BY t.sales_count DESC
      `
    } else {
      themes = await sql`
        SELECT 
          t.*,
          tc.name as category_name,
          tc.slug as category_slug
        FROM themes t
        LEFT JOIN theme_categories tc ON t.category_id = tc.id
        WHERE t.is_active = true
        ORDER BY 
          CASE WHEN ${sort} = 'newest' THEN t.created_at END DESC,
          CASE WHEN ${sort} = 'popular' THEN t.sales_count END DESC,
          CASE WHEN ${sort} = 'price-low' THEN t.price_cents END ASC,
          CASE WHEN ${sort} = 'price-high' THEN t.price_cents END DESC,
          CASE WHEN ${sort} = 'rating' THEN t.rating_avg END DESC
      `
    }

    return NextResponse.json({ themes })
  } catch (error) {
    console.error("Error fetching themes:", error)
    return NextResponse.json({ error: "Failed to fetch themes", themes: [] }, { status: 500 })
  }
}
