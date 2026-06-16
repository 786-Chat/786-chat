import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get customer's primary published site
    const sites = await sql`
      SELECT
        id,
        site_name,
        subdomain,
        custom_domain
      FROM customer_sites
      WHERE user_id = ${session.id}::uuid
        AND is_published = true
      ORDER BY updated_at DESC
      LIMIT 1
    `

    if (sites.length > 0) {
      const site = sites[0]

      const siteUrl = site.custom_domain
        ? `https://${site.custom_domain}`
        : site.subdomain
        ? `https://${site.subdomain}.mujeebproai.com`
        : null

      return NextResponse.json({
        siteUrl,
        siteName: site.site_name,
        siteId: site.id,
        subdomain: site.subdomain,
      })
    }

    // Fallback to verified custom domain
    const domains = await sql`
      SELECT domain
      FROM user_domains
      WHERE user_id = ${session.id}::uuid
        AND status = 'verified'
      ORDER BY is_primary DESC
      LIMIT 1
    `

    if (domains.length > 0) {
      return NextResponse.json({
        siteUrl: `https://${domains[0].domain}`,
        siteName: domains[0].domain,
      })
    }

    return NextResponse.json({
      siteUrl: null,
      message: "No published site found",
    })
  } catch (error) {
    console.error("Error fetching site:", error)

    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    )
  }
}
