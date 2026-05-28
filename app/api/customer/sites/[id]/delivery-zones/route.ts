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

    const zones = await sql`
      SELECT * FROM delivery_zones 
      WHERE site_id = ${siteId}
      ORDER BY zone_name ASC
    `

    return NextResponse.json({ zones })
  } catch (error) {
    console.error("Error fetching delivery zones:", error)
    return NextResponse.json({ error: "Failed to fetch delivery zones" }, { status: 500 })
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
    const { zone_name, postcodes, delivery_fee, minimum_order, estimated_time_minutes, is_active } = body

    const [zone] = await sql`
      INSERT INTO delivery_zones (
        site_id, zone_name, postcodes, delivery_fee, minimum_order, estimated_time_minutes, is_active
      ) VALUES (
        ${siteId}, ${zone_name}, ${postcodes}, ${delivery_fee}, ${minimum_order}, ${estimated_time_minutes}, ${is_active}
      )
      RETURNING *
    `

    return NextResponse.json({ zone })
  } catch (error) {
    console.error("Error creating delivery zone:", error)
    return NextResponse.json({ error: "Failed to create delivery zone" }, { status: 500 })
  }
}
