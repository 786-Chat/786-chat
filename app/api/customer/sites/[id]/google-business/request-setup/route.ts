import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getSession()
    
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify site ownership
    const [site] = await sql`
      SELECT id, site_name, subdomain, user_id FROM customer_sites 
      WHERE id = ${id} AND user_id = ${payload.id}
    `
    
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const body = await request.json()
    const { businessName, address, phone, email, category, description, notes } = body

    // Update settings with setup request
    const setupNotes = JSON.stringify({
      businessName,
      address,
      phone,
      email,
      category,
      description,
      additionalNotes: notes,
      requestedBy: payload.email,
      siteName: site.site_name,
      subdomain: site.subdomain,
    })

    // Check if settings exist
    const [existingSettings] = await sql`
      SELECT id FROM customer_site_settings WHERE site_id = ${id}
    `

    if (existingSettings) {
      await sql`
        UPDATE customer_site_settings SET
          google_verification_status = 'assisted_setup_requested',
          google_setup_notes = ${setupNotes},
          google_assisted_setup = true,
          google_setup_requested_at = NOW(),
          updated_at = NOW()
        WHERE site_id = ${id}
      `
    } else {
      await sql`
        INSERT INTO customer_site_settings (
          site_id, 
          google_verification_status,
          google_setup_notes,
          google_assisted_setup,
          google_setup_requested_at
        ) VALUES (
          ${id},
          'assisted_setup_requested',
          ${setupNotes},
          true,
          NOW()
        )
      `
    }

    // Log the request for admin tracking
    await sql`
      INSERT INTO admin_logs (
        admin_id, admin_email, action, entity_type, entity_id, entity_name, details
      ) VALUES (
        ${payload.id},
        ${payload.email},
        'google_setup_requested',
        'customer_site',
        ${id},
        ${site.site_name},
        ${JSON.stringify({ businessName, address, phone, email, category })}::jsonb
      )
    `

    return NextResponse.json({ 
      success: true,
      message: "Setup request submitted successfully"
    })
  } catch (error) {
    console.error("Error requesting Google Business setup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
