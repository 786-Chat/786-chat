import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const payload = await getSession()
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const themes = await sql`
      SELECT * FROM imported_themes 
      ORDER BY created_at DESC
    `

    return NextResponse.json(themes)
  } catch (error) {
    console.error("Error fetching imported themes:", error)
    return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getSession()
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      category,
      price,
      source_type,
      source_url,
      preview_image_url,
      colors,
      fonts,
      features,
    } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    // Check if slug already exists
    const existing = await sql`
      SELECT id FROM imported_themes WHERE slug = ${slug}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Theme with this slug already exists" }, { status: 400 })
    }

    const theme = await sql`
      INSERT INTO imported_themes (
        name, slug, description, category, price, source_type, source_url,
        preview_image_url, colors, fonts, features, uploaded_by
      ) VALUES (
        ${name}, ${slug}, ${description || null}, ${category}, ${price || 0},
        ${source_type}, ${source_url || null}, ${preview_image_url || null},
        ${JSON.stringify(colors)}, ${JSON.stringify(fonts)}, ${JSON.stringify(features || [])},
        ${payload.id}
      )
      RETURNING *
    `

    return NextResponse.json(theme[0])
  } catch (error) {
    console.error("Error creating imported theme:", error)
    return NextResponse.json({ error: "Failed to create theme" }, { status: 500 })
  }
}
