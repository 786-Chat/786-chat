import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const subdomain = request.nextUrl.searchParams.get("subdomain")
    
    if (!subdomain) {
      return NextResponse.json({ error: "Missing subdomain" }, { status: 400 })
    }

    const [site] = await sql`
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
        cs.is_locked,
        cs.lock_reason,
        cs.subscription_status,
        cs.grace_period_end,
        t.name as theme_name,
        t.slug as theme_slug
      FROM customer_sites cs
      LEFT JOIN themes t ON cs.theme_id = t.id
      WHERE cs.subdomain = ${subdomain}
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Check if site is locked/suspended
    if (site.is_locked || site.subscription_status === 'suspended') {
      return NextResponse.json({ 
        site: {
          id: site.id,
          site_name: site.site_name,
          subdomain: site.subdomain,
        },
        suspended: true,
        reason: site.lock_reason || "subscription_expired"
      })
    }

    // Check if not published
    if (!site.is_published) {
      return NextResponse.json({ error: "Site not published" }, { status: 404 })
    }

    return NextResponse.json({ site, suspended: false })
  } catch (error) {
    console.error("Error fetching site:", error)
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 })
  }
}
