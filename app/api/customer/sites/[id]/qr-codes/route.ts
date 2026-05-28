import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const qrCodes = await sql`
      SELECT * FROM qr_codes 
      WHERE site_id = ${siteId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ qrCodes })
  } catch (error) {
    console.error("Error fetching QR codes:", error)
    return NextResponse.json({ error: "Failed to fetch QR codes" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, table_number, qr_type } = body

    // Get site subdomain for URL
    const [site] = await sql`SELECT subdomain FROM customer_sites WHERE id = ${siteId}`
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"
    const targetUrl = qr_type === "order" 
      ? `${baseUrl}/site/${site.subdomain}/order${table_number ? `?table=${table_number}` : ""}`
      : `${baseUrl}/site/${site.subdomain}/menu${table_number ? `?table=${table_number}` : ""}`

    const [qrCode] = await sql`
      INSERT INTO qr_codes (site_id, name, table_number, qr_type, target_url)
      VALUES (${siteId}, ${name}, ${table_number || null}, ${qr_type}, ${targetUrl})
      RETURNING *
    `

    return NextResponse.json({ qrCode })
  } catch (error) {
    console.error("Error creating QR code:", error)
    return NextResponse.json({ error: "Failed to create QR code" }, { status: 500 })
  }
}
