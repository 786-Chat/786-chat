import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id, staffId } = await params
    const payload = await getSession()

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify site ownership
    const sites = await sql`
      SELECT id FROM customer_sites WHERE id = ${id} AND user_id = ${payload.id}
    `
    if (sites.length === 0) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, email, phone, pin, role, is_active } = body

    // If updating PIN, check for duplicates
    if (pin) {
      const existingPin = await sql`
        SELECT id FROM restaurant_users WHERE site_id = ${id} AND pin = ${pin} AND id != ${staffId}
      `
      if (existingPin.length > 0) {
        return NextResponse.json({ error: "This PIN is already in use" }, { status: 400 })
      }
    }

    const [staff] = await sql`
      UPDATE restaurant_users SET
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        pin = COALESCE(${pin}, pin),
        role = COALESCE(${role}, role),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${staffId} AND site_id = ${id}
      RETURNING *
    `

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("Failed to update staff:", error)
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id, staffId } = await params
    const payload = await getSession()

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify site ownership
    const sites = await sql`
      SELECT id FROM customer_sites WHERE id = ${id} AND user_id = ${payload.id}
    `
    if (sites.length === 0) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    await sql`DELETE FROM restaurant_users WHERE id = ${staffId} AND site_id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete staff:", error)
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 })
  }
}
