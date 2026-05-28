import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getSession()
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const theme = await sql`
      SELECT * FROM imported_themes WHERE id = ${id}
    `

    if (theme.length === 0) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    return NextResponse.json(theme[0])
  } catch (error) {
    console.error("Error fetching theme:", error)
    return NextResponse.json({ error: "Failed to fetch theme" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getSession()
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
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
      preview_url,
      colors,
      fonts,
      features,
      is_active,
      is_featured,
      is_ready_for_sale,
      version,
    } = body

    const theme = await sql`
      UPDATE imported_themes SET
        name = COALESCE(${name}, name),
        slug = COALESCE(${slug}, slug),
        description = COALESCE(${description}, description),
        category = COALESCE(${category}, category),
        price = COALESCE(${price}, price),
        source_type = COALESCE(${source_type}, source_type),
        source_url = COALESCE(${source_url}, source_url),
        preview_image_url = COALESCE(${preview_image_url}, preview_image_url),
        preview_url = COALESCE(${preview_url}, preview_url),
        colors = COALESCE(${colors ? JSON.stringify(colors) : null}, colors),
        fonts = COALESCE(${fonts ? JSON.stringify(fonts) : null}, fonts),
        features = COALESCE(${features ? JSON.stringify(features) : null}, features),
        is_active = COALESCE(${is_active}, is_active),
        is_featured = COALESCE(${is_featured}, is_featured),
        is_ready_for_sale = COALESCE(${is_ready_for_sale}, is_ready_for_sale),
        version = COALESCE(${version}, version),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (theme.length === 0) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    return NextResponse.json(theme[0])
  } catch (error) {
    console.error("Error updating theme:", error)
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getSession()
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await sql`DELETE FROM imported_themes WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting theme:", error)
    return NextResponse.json({ error: "Failed to delete theme" }, { status: 500 })
  }
}
