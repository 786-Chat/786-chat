import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { pin, role } = body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid site ID. Please use a valid restaurant URL." }, { status: 400 })
    }

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 400 })
    }

    // Find staff member with this PIN
    const staff = await sql`
      SELECT ru.id, ru.name, ru.role, ru.is_active
      FROM restaurant_users ru
      WHERE ru.site_id = ${id} AND ru.pin = ${pin} AND ru.is_active = true
    `

    if (staff.length === 0) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })
    }

    const member = staff[0]

    // Check role access
    if (role === "manager" && !["manager", "owner"].includes(member.role as string)) {
      return NextResponse.json({ error: "Access denied. Manager PIN required." }, { status: 403 })
    }

    if (role === "kitchen" && !["manager", "owner", "kitchen"].includes(member.role as string)) {
      return NextResponse.json({ error: "Access denied. Kitchen or Manager PIN required." }, { status: 403 })
    }

    if (role === "driver" && !["manager", "owner", "driver"].includes(member.role as string)) {
      return NextResponse.json({ error: "Access denied. Driver or Manager PIN required." }, { status: 403 })
    }

    return NextResponse.json({
      id: member.id,
      name: member.name,
      role: member.role,
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
