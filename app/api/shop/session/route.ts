import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { sql } from "@/lib/db"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("shop-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    // Get site info for this shopkeeper
    const [site] = await sql`
      SELECT 
        cs.id, 
        cs.site_name, 
        cs.subdomain,
        cs.is_active,
        cs.is_locked,
        css.business_name,
        css.payment_status
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      WHERE cs.id = ${payload.siteId}
    `

    return NextResponse.json({
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        siteId: payload.siteId,
      },
      site: site || null,
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }
}
