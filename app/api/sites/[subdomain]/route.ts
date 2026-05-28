import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    // Get site by subdomain
    const [site] = await sql`
      SELECT id, site_name, subdomain, logo_url, favicon_url, 
             site_config, site_content, theme_name
      FROM customer_sites
      WHERE subdomain = ${subdomain}
    `
    
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }
    
    return NextResponse.json({ site })
  } catch (error) {
    console.error("Failed to fetch site:", error)
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 })
  }
}
