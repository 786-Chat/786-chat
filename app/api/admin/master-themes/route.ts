import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

// GET - List all master themes
export async function GET() {
  try {
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const themes = await sql`
      SELECT t.*, tc.name as category_name
      FROM themes t
      LEFT JOIN theme_categories tc ON t.category_id = tc.id
      ORDER BY t.created_at DESC
    `

    return NextResponse.json({ themes })
  } catch (error) {
    console.error("Failed to fetch themes:", error)
    return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 })
  }
}

// POST - Create new master theme
export async function POST(request: NextRequest) {
  try {
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      long_description,
      category_id,
      price_cents,
      currency,
      thumbnail_url,
      preview_url,
      demo_url,
      is_active,
      is_featured,
      features,
      tags,
    } = body

    // Check if slug already exists
    const existing = await sql`SELECT id FROM themes WHERE slug = ${slug}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Theme with this slug already exists" }, { status: 400 })
    }

    const [theme] = await sql`
      INSERT INTO themes (
        name, slug, description, long_description, category_id,
        price_cents, currency, thumbnail_url, preview_url, demo_url,
        is_active, is_featured, features, tags
      ) VALUES (
        ${name}, ${slug}, ${description}, ${long_description}, ${category_id || null},
        ${price_cents || 4999}, ${currency || "GBP"}, ${thumbnail_url || null}, ${preview_url || null}, ${demo_url || null},
        ${is_active !== false}, ${is_featured || false}, ${JSON.stringify(features || [])}::jsonb, ${tags || []}
      )
      RETURNING *
    `

    // Log action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name)
      VALUES (${payload.id}, ${payload.email}, 'theme_created', 'theme', ${theme.id}, ${name})
    `

    return NextResponse.json({ theme })
  } catch (error) {
    console.error("Failed to create theme:", error)
    return NextResponse.json({ error: "Failed to create theme" }, { status: 500 })
  }
}
