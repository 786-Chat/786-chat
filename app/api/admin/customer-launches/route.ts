import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const payload = await getSession()
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all customer sites with user and settings info
    const launches = await sql`
      SELECT 
        cs.id,
        cs.user_id,
        cs.site_name,
        cs.subdomain,
        cs.custom_domain,
        cs.theme_id,
        cs.theme_name,
        cs.status,
        COALESCE(cs.status, 'draft') as setup_status,
        cs.is_active,
        cs.is_published,
        cs.modules,
        COALESCE(css.payment_status, 'pending') as payment_status,
        cs.stripe_subscription_id,
        COALESCE(css.google_verification_status, 'not_started') as google_verification_status,
        css.admin_notes,
        cs.created_at,
        cs.updated_at,
        css.business_name,
        css.owner_name,
        css.phone,
        css.email,
        u.email as user_email,
        u.name as user_name
      FROM customer_sites cs
      LEFT JOIN users u ON cs.user_id = u.id
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      ORDER BY cs.created_at DESC
    `

    return NextResponse.json({ launches })
  } catch (error) {
    console.error("Failed to fetch customer launches:", error)
    return NextResponse.json(
      { error: "Failed to fetch customer launches" },
      { status: 500 }
    )
  }
}
