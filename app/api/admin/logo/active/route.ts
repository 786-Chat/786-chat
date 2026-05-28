import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

// Admin emails
const ADMIN_EMAILS = ["mujeeb@job4u.com", "admin@mujeebproai.com"]

// POST - Set active logo
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
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Logo ID required" }, { status: 400 })
    }

    // Deactivate all logos first
    await sql`UPDATE site_logos SET is_active = false`

    // Set the selected logo as active
    await sql`UPDATE site_logos SET is_active = true WHERE id = ${id}`

    // Also store in site_settings for easy access
    await sql`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES ('active_logo_id', ${id}, NOW())
      ON CONFLICT (key) 
      DO UPDATE SET value = ${id}, updated_at = NOW()
    `

    return NextResponse.json({ message: "Active logo updated successfully" })
  } catch (error) {
    console.error("Set active logo error:", error)
    return NextResponse.json({ error: "Failed to set active logo" }, { status: 500 })
  }
}

// GET - Get active logo (public endpoint)
export async function GET() {
  try {
    const activeLogo = await sql`
      SELECT * FROM site_logos WHERE is_active = true LIMIT 1
    `

    if (activeLogo.length === 0) {
      return NextResponse.json({ logo: null })
    }

    return NextResponse.json({ logo: activeLogo[0] })
  } catch (error) {
    // Return null if table doesn't exist yet
    return NextResponse.json({ logo: null })
  }
}
