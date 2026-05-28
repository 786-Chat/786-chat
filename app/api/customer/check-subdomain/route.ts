import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get("subdomain")

  if (!subdomain) {
    return NextResponse.json({ available: false, error: "Subdomain required" })
  }

  // Validate subdomain format
  const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")
  
  if (cleanSubdomain.length < 3) {
    return NextResponse.json({ available: false, error: "Subdomain must be at least 3 characters" })
  }

  if (cleanSubdomain.length > 50) {
    return NextResponse.json({ available: false, error: "Subdomain too long" })
  }

  // Reserved subdomains
  const reserved = ["www", "api", "admin", "app", "mail", "blog", "shop", "store", "support", "help"]
  if (reserved.includes(cleanSubdomain)) {
    return NextResponse.json({ available: false, error: "This subdomain is reserved" })
  }

  try {
    const existing = await sql`
      SELECT id FROM customer_sites WHERE subdomain = ${cleanSubdomain}
    `

    return NextResponse.json({ available: existing.length === 0 })
  } catch {
    return NextResponse.json({ available: false, error: "Failed to check availability" })
  }
}
