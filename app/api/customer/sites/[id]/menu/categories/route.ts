import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    
    const categories = await sql`
      SELECT * FROM menu_categories
      WHERE site_id = ${siteId}
      ORDER BY display_order ASC, name ASC
    `
    
    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const body = await request.json()
    const { name, description, image_url } = body
    
    const [category] = await sql`
      INSERT INTO menu_categories (site_id, name, description, image_url)
      VALUES (${siteId}, ${name}, ${description || null}, ${image_url || null})
      RETURNING *
    `
    
    return NextResponse.json({ category })
  } catch (error) {
    console.error("Failed to create category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
