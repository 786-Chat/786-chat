import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

// GET - List all customer sites with settings and payment info
export async function GET() {
  try {
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sites = await sql`
      SELECT 
        cs.*,
        u.email as user_email,
        u.name as user_name,
        u.plan as user_plan,
        css.business_name,
        css.phone,
        css.email as business_email,
        css.payment_status,
        css.show_in_marketplace,
        css.marketplace_approved,
        css.marketplace_featured,
        css.marketplace_category,
        css.is_open,
        css.visibility_mode
      FROM customer_sites cs
      LEFT JOIN users u ON cs.user_id = u.id
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      ORDER BY cs.created_at DESC
    `

    return NextResponse.json({ sites })
  } catch (error) {
    console.error("Failed to fetch sites:", error)
    return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 })
  }
}
