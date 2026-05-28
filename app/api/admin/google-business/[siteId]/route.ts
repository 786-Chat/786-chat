import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    const payload = await getSession()
    
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, profileUrl, connectedEmail, notes } = body

    // Get site info for logging
    const [site] = await sql`
      SELECT site_name FROM customer_sites WHERE id = ${siteId}
    `

    // Update the settings
    await sql`
      UPDATE customer_site_settings SET
        google_verification_status = ${status},
        google_business_profile_url = COALESCE(NULLIF(${profileUrl}, ''), google_business_profile_url),
        google_connected_email = COALESCE(NULLIF(${connectedEmail}, ''), google_connected_email),
        google_last_sync_at = CASE WHEN ${status} = 'verified' THEN NOW() ELSE google_last_sync_at END,
        updated_at = NOW()
      WHERE site_id = ${siteId}
    `

    // Log admin action
    await sql`
      INSERT INTO admin_logs (
        admin_id, admin_email, action, entity_type, entity_id, entity_name, details
      ) VALUES (
        ${payload.id},
        ${payload.email},
        'google_setup_updated',
        'customer_site',
        ${siteId},
        ${site?.site_name || 'Unknown'},
        ${JSON.stringify({ status, profileUrl, connectedEmail, notes })}::jsonb
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating Google Business status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
