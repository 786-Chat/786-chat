import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [settings] = await sql`
      SELECT 
        visibility_mode,
        show_in_marketplace,
        marketplace_approved,
        marketplace_featured,
        marketplace_category,
        delivery_radius_miles,
        estimated_delivery_minutes,
        marketplace_cover_image,
        marketplace_description,
        is_open,
        opening_hours
      FROM customer_site_settings
      WHERE site_id = ${id}::uuid
    `

    return NextResponse.json({ settings: settings || {} })
  } catch (error) {
    console.error("Error fetching visibility settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      visibility_mode,
      marketplace_category,
      delivery_radius_miles,
      estimated_delivery_minutes,
      marketplace_description,
      is_open
    } = body

    // Determine show_in_marketplace based on visibility_mode
    const show_in_marketplace = visibility_mode === "marketplace_only" || visibility_mode === "both"

    await sql`
      UPDATE customer_site_settings SET
        visibility_mode = ${visibility_mode},
        show_in_marketplace = ${show_in_marketplace},
        marketplace_category = ${marketplace_category || null},
        delivery_radius_miles = ${delivery_radius_miles || 5},
        estimated_delivery_minutes = ${estimated_delivery_minutes || 30},
        marketplace_description = ${marketplace_description || null},
        is_open = ${is_open !== false},
        updated_at = NOW()
      WHERE site_id = ${id}::uuid
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating visibility settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
