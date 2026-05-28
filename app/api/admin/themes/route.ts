import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

const ADMIN_EMAILS = ["mujeeb@job4u.com", "admin@mujeebproai.com"]

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const themes = await sql`
      SELECT 
        t.*,
        tc.name as category_name,
        tc.slug as category_slug
      FROM themes t
      LEFT JOIN theme_categories tc ON t.category_id = tc.id
      ORDER BY t.created_at DESC
    `

    const categories = await sql`
      SELECT * FROM theme_categories ORDER BY name ASC
    `

    return NextResponse.json({ themes, categories })
  } catch (error) {
    console.error("Error fetching themes:", error)
    return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
      preview_url,
      demo_url,
      thumbnail_url,
      screenshots,
      features,
      tags,
      is_active,
      is_featured
    } = body

    // Check if slug already exists
    const existing = await sql`SELECT id FROM themes WHERE slug = ${slug}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "A theme with this slug already exists" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO themes (
        name, slug, description, long_description, category_id,
        price_cents, currency, preview_url, demo_url, thumbnail_url,
        screenshots, features, tags, is_active, is_featured
      ) VALUES (
        ${name}, ${slug}, ${description}, ${long_description || ""}, ${category_id || null},
        ${price_cents || 0}, ${currency || "GBP"}, ${preview_url || ""}, ${demo_url || ""}, ${thumbnail_url || ""},
        ${JSON.stringify(screenshots || [])}, ${JSON.stringify(features || [])}, ${tags || []}, ${is_active !== false}, ${is_featured || false}
      )
      RETURNING *
    `

    return NextResponse.json({ theme: result[0] })
  } catch (error) {
    console.error("Error creating theme:", error)
    return NextResponse.json({ error: "Failed to create theme" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE themes SET
        name = ${updates.name},
        slug = ${updates.slug},
        description = ${updates.description},
        long_description = ${updates.long_description || ""},
        category_id = ${updates.category_id || null},
        price_cents = ${updates.price_cents || 0},
        currency = ${updates.currency || "GBP"},
        preview_url = ${updates.preview_url || ""},
        demo_url = ${updates.demo_url || ""},
        thumbnail_url = ${updates.thumbnail_url || ""},
        screenshots = ${JSON.stringify(updates.screenshots || [])},
        features = ${JSON.stringify(updates.features || [])},
        tags = ${updates.tags || []},
        is_active = ${updates.is_active !== false},
        is_featured = ${updates.is_featured || false},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ theme: result[0] })
  } catch (error) {
    console.error("Error updating theme:", error)
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM themes WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting theme:", error)
    return NextResponse.json({ error: "Failed to delete theme" }, { status: 500 })
  }
}
