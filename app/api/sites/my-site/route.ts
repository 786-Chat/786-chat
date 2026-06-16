import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"


export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get customer's primary deployed site
    const sites = await sql`
      SELECT 
        s.id,
        s.name,
        s.subdomain,
        s.custom_domain,
        s.deployed_url,
        s.status
      FROM customer_sites s
      WHERE s.user_id = ${session.id}::uuid
        AND s.status = 'published'
      ORDER BY s.is_primary DESC, s.updated_at DESC
      LIMIT 1
    `

    if (sites.length > 0) {
      const site = sites[0]
      // Prioritize custom domain, then deployed_url, then subdomain
      const siteUrl = site.custom_domain 
        ? `https://${site.custom_domain}`
        : site.deployed_url 
        ? site.deployed_url
        : site.subdomain 
        ? `https://${site.subdomain}.mujeebproai.com`
        : null

      return NextResponse.json({
  siteUrl,
  siteName: site.name,
  siteId: site.id,
  subdomain: site.subdomain,
})

    // Check domains table as fallback
    const domains = await sql`
      SELECT domain, status, is_primary
      FROM user_domains
      WHERE user_id = ${session.id}::uuid
        AND status = 'verified'
      ORDER BY is_primary DESC
      LIMIT 1
    `

    if (domains.length > 0) {
      return NextResponse.json({
        siteUrl: `https://${domains[0].domain}`,
        siteName: domains[0].domain
      })
    }

    return NextResponse.json({ 
      siteUrl: null,
      message: "No published site found"
    })
  } catch (error) {
    console.error("Error fetching site:", error)
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 })
  }
}
