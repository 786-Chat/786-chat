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

    const imports = await sql`
      SELECT 
        wi.*,
        u.email as user_email,
        u.name as user_name
      FROM website_imports wi
      LEFT JOIN users u ON wi.user_id = u.id
      WHERE wi.id = ${id}
    `

    if (imports.length === 0) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 })
    }

    return NextResponse.json(imports[0])
  } catch (error) {
    console.error("Error fetching import:", error)
    return NextResponse.json({ error: "Failed to fetch import" }, { status: 500 })
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
      import_status, 
      admin_notes, 
      preview_url, 
      selected_theme_id,
      import_type,
      extracted_content
    } = body

    // Update processed_at when starting processing
    // Update published_at when publishing
    await sql`
      UPDATE website_imports
      SET 
        import_status = COALESCE(${import_status}, import_status),
        admin_notes = COALESCE(${admin_notes}, admin_notes),
        preview_url = COALESCE(${preview_url}, preview_url),
        selected_theme_id = COALESCE(${selected_theme_id}, selected_theme_id),
        import_type = COALESCE(${import_type}, import_type),
        original_content = COALESCE(${extracted_content ? JSON.stringify(extracted_content) : null}::jsonb, original_content),
        processed_at = CASE WHEN ${import_status} = 'processing' THEN NOW() ELSE processed_at END,
        published_at = CASE WHEN ${import_status} = 'published' THEN NOW() ELSE published_at END,
        updated_at = NOW()
      WHERE id = ${id}
    `

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, details)
      VALUES (${payload.id}, ${payload.email}, 'update_import', 'website_import', ${id}, ${JSON.stringify({ status: import_status })}::jsonb)
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating import:", error)
    return NextResponse.json({ error: "Failed to update import" }, { status: 500 })
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

    await sql`DELETE FROM website_imports WHERE id = ${id}`

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id)
      VALUES (${payload.id}, ${payload.email}, 'delete_import', 'website_import', ${id})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting import:", error)
    return NextResponse.json({ error: "Failed to delete import" }, { status: 500 })
  }
}
