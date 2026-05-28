import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

// Admin emails
const ADMIN_EMAILS = ["mujeeb@job4u.com", "admin@mujeebproai.com"]

// GET - Fetch all logos
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if logos table exists, create if not
    await sql`
      CREATE TABLE IF NOT EXISTS site_logos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL DEFAULT 'image',
        url TEXT NOT NULL,
        filename VARCHAR(255),
        size INTEGER DEFAULT 0,
        width INTEGER,
        height INTEGER,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    const logos = await sql`
      SELECT * FROM site_logos ORDER BY created_at DESC
    `

    return NextResponse.json({ logos })
  } catch (error) {
    console.error("Logo GET error:", error)
    return NextResponse.json({ error: "Failed to fetch logos" }, { status: 500 })
  }
}

// POST - Upload new logo
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { type, data, url, filename, size, width, height } = body

    // Validate
    if (!data && !url) {
      return NextResponse.json({ error: "No logo data provided" }, { status: 400 })
    }

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS site_logos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL DEFAULT 'image',
        url TEXT NOT NULL,
        filename VARCHAR(255),
        size INTEGER DEFAULT 0,
        width INTEGER,
        height INTEGER,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Use base64 data or external URL
    const logoUrl = data || url

    const result = await sql`
      INSERT INTO site_logos (type, url, filename, size, width, height)
      VALUES (${type || "image"}, ${logoUrl}, ${filename || "logo"}, ${size || 0}, ${width || null}, ${height || null})
      RETURNING *
    `

    return NextResponse.json({ logo: result[0], message: "Logo uploaded successfully" })
  } catch (error) {
    console.error("Logo POST error:", error)
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
  }
}

// DELETE - Remove a logo
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Logo ID required" }, { status: 400 })
    }

    await sql`DELETE FROM site_logos WHERE id = ${id}`

    return NextResponse.json({ message: "Logo deleted successfully" })
  } catch (error) {
    console.error("Logo DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete logo" }, { status: 500 })
  }
}
