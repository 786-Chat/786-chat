import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; zoneId: string }> }
) {
  try {
    const { id: siteId, zoneId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { zone_name, postcodes, delivery_fee, minimum_order, estimated_time_minutes, is_active } = body

    const [zone] = await sql`
      UPDATE delivery_zones SET
        zone_name = ${zone_name},
        postcodes = ${postcodes},
        delivery_fee = ${delivery_fee},
        minimum_order = ${minimum_order},
        estimated_time_minutes = ${estimated_time_minutes},
        is_active = ${is_active}
      WHERE id = ${zoneId} AND site_id = ${siteId}
      RETURNING *
    `

    return NextResponse.json({ zone })
  } catch (error) {
    console.error("Error updating delivery zone:", error)
    return NextResponse.json({ error: "Failed to update delivery zone" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; zoneId: string }> }
) {
  try {
    const { id: siteId, zoneId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`
      DELETE FROM delivery_zones 
      WHERE id = ${zoneId} AND site_id = ${siteId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting delivery zone:", error)
    return NextResponse.json({ error: "Failed to delete delivery zone" }, { status: 500 })
  }
}
