import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const staff = await sql`
      SELECT id, name, email, phone, pin, role, is_active, avatar_url, created_at
      FROM restaurant_users
      WHERE site_id = ${id}
      ORDER BY 
        CASE role 
          WHEN 'manager' THEN 1 
          WHEN 'kitchen' THEN 2 
          WHEN 'driver' THEN 3 
          ELSE 4 
        END,
        name ASC
    `

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("Failed to fetch staff:", error)
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { name, email, phone, pin, role } = body

    if (!name || !pin || pin.length !== 4) {
      return NextResponse.json({ error: "Name and 4-digit PIN are required" }, { status: 400 })
    }

    // Check for duplicate PIN in this site
    const existingPin = await sql`
      SELECT id FROM restaurant_users WHERE site_id = ${id} AND pin = ${pin}
    `
    if (existingPin.length > 0) {
      return NextResponse.json({ error: "This PIN is already in use" }, { status: 400 })
    }

    const [staff] = await sql`
      INSERT INTO restaurant_users (site_id, name, email, phone, pin, role)
      VALUES (${id}, ${name}, ${email || null}, ${phone || null}, ${pin}, ${role || 'staff'})
      RETURNING *
    `

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("Failed to create staff:", error)
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 })
  }
}
