import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [settings] = await sql`
      SELECT * FROM marketplace_settings LIMIT 1
    `

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { is_enabled, commission_percentage, featured_fee, default_radius_miles } = body

    // Check if settings exist
    const [existing] = await sql`SELECT id FROM marketplace_settings LIMIT 1`

    if (existing) {
      await sql`
        UPDATE marketplace_settings SET
          is_enabled = ${is_enabled},
          commission_percentage = ${commission_percentage || 0},
          featured_fee = ${featured_fee || 0},
          default_radius_miles = ${default_radius_miles || 5},
          updated_at = NOW()
        WHERE id = ${existing.id}
      `
    } else {
      await sql`
        INSERT INTO marketplace_settings (is_enabled, commission_percentage, featured_fee, default_radius_miles)
        VALUES (${is_enabled}, ${commission_percentage || 0}, ${featured_fee || 0}, ${default_radius_miles || 5})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
