import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reservationId: string }> }
) {
  try {
    const { id: siteId, reservationId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { status, table_number } = body

    let updateQuery
    if (status === "confirmed") {
      updateQuery = await sql`
        UPDATE table_reservations 
        SET status = ${status}, table_number = ${table_number}, confirmed_at = NOW(), updated_at = NOW()
        WHERE id = ${reservationId} AND site_id = ${siteId}
        RETURNING *
      `
    } else if (status === "cancelled") {
      updateQuery = await sql`
        UPDATE table_reservations 
        SET status = ${status}, cancelled_at = NOW(), cancel_reason = ${body.cancel_reason || null}, updated_at = NOW()
        WHERE id = ${reservationId} AND site_id = ${siteId}
        RETURNING *
      `
    } else {
      updateQuery = await sql`
        UPDATE table_reservations 
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${reservationId} AND site_id = ${siteId}
        RETURNING *
      `
    }

    return NextResponse.json({ reservation: updateQuery[0] })
  } catch (error) {
    console.error("Error updating reservation:", error)
    return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reservationId: string }> }
) {
  try {
    const { id: siteId, reservationId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`
      DELETE FROM table_reservations 
      WHERE id = ${reservationId} AND site_id = ${siteId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting reservation:", error)
    return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 })
  }
}
