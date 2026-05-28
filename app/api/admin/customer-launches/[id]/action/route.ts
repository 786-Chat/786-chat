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
    const { action } = body

    // Get site info
    const [site] = await sql`
      SELECT cs.*, css.email as site_email, u.email as user_email, u.name as user_name
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      LEFT JOIN users u ON cs.user_id = u.id
      WHERE cs.id = ${id}
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    switch (action) {
      case "suspend":
        await sql`UPDATE customer_sites SET is_active = false, status = 'suspended', updated_at = NOW() WHERE id = ${id}`
        break

      case "activate":
        await sql`UPDATE customer_sites SET is_active = true, status = 'live', updated_at = NOW() WHERE id = ${id}`
        break

      case "mark_complete":
        await sql`UPDATE customer_sites SET status = 'live', is_published = true, updated_at = NOW() WHERE id = ${id}`
        break

      case "request_google":
        await sql`
          UPDATE customer_site_settings SET 
            google_verification_status = 'pending',
            google_setup_requested_at = NOW(),
            google_assisted_setup = true,
            updated_at = NOW()
          WHERE site_id = ${id}
        `
        await sql`UPDATE customer_sites SET status = 'google_pending', updated_at = NOW() WHERE id = ${id}`
        break

      case "resend_login":
        // In production, this would send an email with login details
        // For now, just log the action
        break

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name, details)
      VALUES (
        ${payload.id}, 
        ${payload.email}, 
        ${action}, 
        'customer_site', 
        ${id}, 
        ${site.site_name},
        ${JSON.stringify({ action, site_email: site.site_email || site.user_email })}::jsonb
      )
    `

    return NextResponse.json({ success: true, action })
  } catch (error) {
    console.error("Failed to perform action:", error)
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    )
  }
}
