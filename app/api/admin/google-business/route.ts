import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const payload = await getSession()
    
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requests = await sql`
      SELECT 
        css.id,
        css.site_id,
        cs.site_name,
        cs.subdomain,
        u.name as owner_name,
        u.email as owner_email,
        css.google_verification_status,
        css.google_setup_notes,
        css.google_setup_requested_at,
        css.google_business_profile_url,
        css.google_connected_email
      FROM customer_site_settings css
      JOIN customer_sites cs ON css.site_id = cs.id
      JOIN users u ON cs.user_id = u.id
      WHERE css.google_assisted_setup = true
      ORDER BY 
        CASE css.google_verification_status 
          WHEN 'assisted_setup_requested' THEN 1
          WHEN 'assisted_setup_in_progress' THEN 2
          WHEN 'pending_verification' THEN 3
          ELSE 4
        END,
        css.google_setup_requested_at DESC
    `

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching Google Business requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
