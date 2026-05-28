import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const result = await sql`
      SELECT id, site_name, subdomain
      FROM customer_sites
      WHERE is_active = true AND is_published = true
      ORDER BY site_name ASC
    `

    return NextResponse.json({ sites: result })
  } catch (error) {
    console.error("Error fetching sites:", error)
    return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 })
  }
}
