import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const cookieStore = await cookies()

    const token =
      cookieStore.get("auth-token")?.value ||
      cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)

    if (!payload?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sites = await sql`
      SELECT 
        cs.id,
        cs.site_name,
        cs.subdomain,
        cs.custom_domain,
        cs.site_config,
        cs.site_content,
        cs.logo_url,
        cs.favicon_url,
        cs.is_published,
        cs.is_active,
        cs.created_at,
        cs.updated_at,
        t.name as theme_name,
        t.slug as theme_slug,
        t.thumbnail_url as theme_thumbnail
      FROM customer_sites cs
      LEFT JOIN themes t ON cs.theme_id = t.id
      WHERE cs.user_id = ${payload.id}::uuid
      ORDER BY cs.created_at DESC
    `

    return NextResponse.json({ sites })
  } catch (error) {
    console.error("Error fetching customer sites:", error)
    return NextResponse.json(
      { error: "Failed to fetch sites", sites: [] },
      { status: 500 }
    )
  }
}
