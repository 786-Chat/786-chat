import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

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
    const { theme_id, preview_url } = body

    // Get the import request
    const imports = await sql`
      SELECT * FROM website_imports WHERE id = ${id}
    `

    if (imports.length === 0) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 })
    }

    const importReq = imports[0]
    const businessInfo = importReq.original_content || {}

    // Create customer site
    const sites = await sql`
      INSERT INTO customer_sites (
        user_id,
        name,
        subdomain,
        theme_id,
        theme_name,
        status,
        subscription_status,
        activated_at
      ) VALUES (
        ${importReq.user_id},
        ${businessInfo.businessName || 'Imported Website'},
        ${`imported-${Date.now()}`},
        ${theme_id},
        ${theme_id},
        'active',
        'active',
        NOW()
      )
      RETURNING id
    `

    const siteId = sites[0].id

    // Update import record
    await sql`
      UPDATE website_imports
      SET 
        import_status = 'published',
        site_id = ${siteId},
        selected_theme_id = ${theme_id},
        preview_url = ${preview_url},
        published_at = NOW(),
        updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ 
      success: true, 
      siteId,
      message: "Website published successfully" 
    })
  } catch (error) {
    console.error("Error publishing import:", error)
    return NextResponse.json({ error: "Failed to publish website" }, { status: 500 })
  }
}
