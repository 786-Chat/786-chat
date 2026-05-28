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

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const filter = request.nextUrl.searchParams.get("filter") || "all"
    const date = request.nextUrl.searchParams.get("date")

    let reservations
    if (filter === "today") {
      reservations = await sql`
        SELECT * FROM table_reservations 
        WHERE site_id = ${siteId} 
        AND reservation_date = CURRENT_DATE
        ORDER BY reservation_time ASC
      `
    } else if (filter === "upcoming") {
      reservations = await sql`
        SELECT * FROM table_reservations 
        WHERE site_id = ${siteId} 
        AND reservation_date >= CURRENT_DATE
        AND status != 'cancelled'
        ORDER BY reservation_date ASC, reservation_time ASC
      `
    } else if (date) {
      reservations = await sql`
        SELECT * FROM table_reservations 
        WHERE site_id = ${siteId} 
        AND reservation_date = ${date}
        ORDER BY reservation_time ASC
      `
    } else {
      reservations = await sql`
        SELECT * FROM table_reservations 
        WHERE site_id = ${siteId} 
        ORDER BY reservation_date DESC, reservation_time DESC
        LIMIT 100
      `
    }

    return NextResponse.json({ reservations })
  } catch (error) {
    console.error("Error fetching reservations:", error)
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const body = await request.json()
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      party_size, 
      reservation_date, 
      reservation_time,
      special_requests 
    } = body

    const [reservation] = await sql`
      INSERT INTO table_reservations (
        site_id, customer_name, customer_email, customer_phone,
        party_size, reservation_date, reservation_time, special_requests
      ) VALUES (
        ${siteId}, ${customer_name}, ${customer_email}, ${customer_phone},
        ${party_size}, ${reservation_date}, ${reservation_time}, ${special_requests}
      )
      RETURNING *
    `

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error("Error creating reservation:", error)
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 })
  }
}
