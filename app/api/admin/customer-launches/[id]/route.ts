import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

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
      setup_status,
      payment_status,
      google_verification_status,
      is_active,
      admin_notes,
    } = body

    // Update customer_sites
    if (setup_status !== undefined || is_active !== undefined) {
      await sql`
        UPDATE customer_sites SET
          status = COALESCE(${setup_status}, status),
          is_active = COALESCE(${is_active}, is_active),
          updated_at = NOW()
        WHERE id = ${id}
      `
    }

    // Update customer_site_settings
    if (payment_status !== undefined || google_verification_status !== undefined || admin_notes !== undefined) {
      await sql`
        UPDATE customer_site_settings SET
          payment_status = COALESCE(${payment_status}, payment_status),
          google_verification_status = COALESCE(${google_verification_status}, google_verification_status),
          admin_notes = COALESCE(${admin_notes}, admin_notes),
          updated_at = NOW()
        WHERE site_id = ${id}
      `
    }

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, details)
      VALUES (${payload.id}, ${payload.email}, 'update_launch', 'customer_site', ${id}, ${JSON.stringify(body)}::jsonb)
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update customer launch:", error)
    return NextResponse.json(
      { error: "Failed to update customer launch" },
      { status: 500 }
    )
  }
}
