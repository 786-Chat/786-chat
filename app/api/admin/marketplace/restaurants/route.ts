import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const restaurants = await sql`
      SELECT 
        cs.id,
        cs.site_name,
        cs.subdomain,
        u.email as user_email,
        css.visibility_mode,
        css.show_in_marketplace,
        css.marketplace_approved,
        css.marketplace_featured,
        css.marketplace_category,
        css.is_open
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      LEFT JOIN users u ON cs.user_id = u.id
      ORDER BY css.show_in_marketplace DESC, css.marketplace_approved ASC, cs.site_name ASC
    `

    return NextResponse.json({ restaurants })
  } catch (error) {
    console.error("Error fetching restaurants:", error)
    return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500 })
  }
}
