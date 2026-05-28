import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

// GET - Get single theme
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [theme] = await sql`
      SELECT t.*, tc.name as category_name
      FROM themes t
      LEFT JOIN theme_categories tc ON t.category_id = tc.id
      WHERE t.id = ${id}
    `

    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    return NextResponse.json({ theme })
  } catch (error) {
    console.error("Failed to fetch theme:", error)
    return NextResponse.json({ error: "Failed to fetch theme" }, { status: 500 })
  }
}

// PUT - Update theme
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: unknown[] = []

    // Build dynamic update query
    const allowedFields = [
      "name", "slug", "description", "long_description", "category_id",
      "price_cents", "currency", "thumbnail_url", "preview_url", "demo_url",
      "is_active", "is_featured", "features", "tags"
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "features") {
          updates.push(`${field} = $${values.length + 1}::jsonb`)
          values.push(JSON.stringify(body[field]))
        } else if (field === "tags") {
          updates.push(`${field} = $${values.length + 1}`)
          values.push(body[field])
        } else {
          updates.push(`${field} = $${values.length + 1}`)
          values.push(body[field])
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)

    const [theme] = await sql`
      UPDATE themes SET
        name = COALESCE(${body.name}, name),
        slug = COALESCE(${body.slug}, slug),
        description = COALESCE(${body.description}, description),
        long_description = COALESCE(${body.long_description}, long_description),
        category_id = COALESCE(${body.category_id}, category_id),
        price_cents = COALESCE(${body.price_cents}, price_cents),
        currency = COALESCE(${body.currency}, currency),
        thumbnail_url = COALESCE(${body.thumbnail_url}, thumbnail_url),
        preview_url = COALESCE(${body.preview_url}, preview_url),
        demo_url = COALESCE(${body.demo_url}, demo_url),
        is_active = COALESCE(${body.is_active}, is_active),
        is_featured = COALESCE(${body.is_featured}, is_featured),
        features = COALESCE(${body.features ? JSON.stringify(body.features) : null}::jsonb, features),
        tags = COALESCE(${body.tags}, tags),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    // Log action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name, details)
      VALUES (${payload.id}, ${payload.email}, 'theme_edited', 'theme', ${id}, ${theme.name}, ${JSON.stringify(body)}::jsonb)
    `

    return NextResponse.json({ theme })
  } catch (error) {
    console.error("Failed to update theme:", error)
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 })
  }
}

// DELETE - Delete theme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get theme name before delete
    const [theme] = await sql`SELECT name FROM themes WHERE id = ${id}`

    const result = await sql`DELETE FROM themes WHERE id = ${id}`

    // Log action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name)
      VALUES (${payload.id}, ${payload.email}, 'theme_deleted', 'theme', ${id}, ${theme?.name || 'Unknown'})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete theme:", error)
    return NextResponse.json({ error: "Failed to delete theme" }, { status: 500 })
  }
}
