import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id, orderId } = await params
    const body = await request.json()
    const { status, driverId } = body

    // Build dynamic update based on status
    const statusTimestampMap: Record<string, string> = {
      accepted: "accepted_at",
      preparing: "preparing_at",
      ready: "ready_at",
      out_for_delivery: "out_for_delivery_at",
      delivered: "delivered_at",
      cancelled: "cancelled_at",
    }

    const timestampField = statusTimestampMap[status]

    let order

    if (status === "out_for_delivery" && driverId) {
      // Get driver info
      const drivers = await sql`
        SELECT name, phone FROM restaurant_users WHERE id = ${driverId}
      `
      const driver = drivers[0]
      
      ;[order] = await sql`
        UPDATE orders SET
          status = ${status},
          driver_id = ${driverId},
          driver_name = ${driver?.name || null},
          driver_phone = ${driver?.phone || null},
          out_for_delivery_at = NOW(),
          updated_at = NOW()
        WHERE id = ${orderId} AND site_id = ${id}
        RETURNING *
      `
    } else if (timestampField) {
      ;[order] = await sql`
        UPDATE orders SET
          status = ${status},
          ${sql.unsafe(timestampField)} = NOW(),
          updated_at = NOW()
        WHERE id = ${orderId} AND site_id = ${id}
        RETURNING *
      `
    } else {
      ;[order] = await sql`
        UPDATE orders SET
          status = ${status},
          updated_at = NOW()
        WHERE id = ${orderId} AND site_id = ${id}
        RETURNING *
      `
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Failed to update order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
