import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

// Convert import to reusable theme in the theme library
export async function POST(
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
      colors,
      fonts,
      features 
    } = body

    // Get the import
    const imports = await sql`
      SELECT * FROM website_imports WHERE id = ${id}
    `
    if (imports.length === 0) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 })
    }

    const importData = imports[0]

    // Check if slug is unique
    const existingThemes = await sql`
      SELECT id FROM imported_themes WHERE slug = ${slug}
    `
    if (existingThemes.length > 0) {
      return NextResponse.json({ error: "Theme slug already exists" }, { status: 400 })
    }

    // Create the theme in imported_themes table
    const themes = await sql`
      INSERT INTO imported_themes (
        name,
        slug,
        description,
        category,
        price,
        source_type,
        source_url,
        colors,
        fonts,
        features,
        is_active,
        is_ready_for_sale,
        uploaded_by,
        created_at
      )
      VALUES (
        ${name},
        ${slug},
        ${description || ''},
        ${category || 'restaurant'},
        ${price || 0},
        ${importData.import_type || 'url_import'},
        ${importData.source_url || ''},
        ${JSON.stringify(colors || { primary: '#000000', secondary: '#666666', accent: '#0066cc' })}::jsonb,
        ${JSON.stringify(fonts || { heading: 'Inter', body: 'Inter' })}::jsonb,
        ${JSON.stringify(features || [])}::jsonb,
        false,
        false,
        ${payload.id},
        NOW()
      )
      RETURNING id
    `

    const themeId = themes[0].id

    // Update import status
    await sql`
      UPDATE website_imports
      SET 
        import_status = 'converted_to_theme',
        selected_theme_id = ${themeId},
        updated_at = NOW()
      WHERE id = ${id}
    `

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, details)
      VALUES (${payload.id}, ${payload.email}, 'convert_to_theme', 'website_import', ${id}, ${JSON.stringify({ themeId, themeName: name })}::jsonb)
    `

    return NextResponse.json({ 
      success: true, 
      themeId,
      message: "Theme created successfully" 
    })
  } catch (error) {
    console.error("Error converting to theme:", error)
    return NextResponse.json({ error: "Failed to convert to theme" }, { status: 500 })
  }
}
