import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const driverId = searchParams.get("driverId")

    let orders

    if (role === "kitchen") {
      // Kitchen sees: pending, accepted, preparing, ready orders
      orders = await sql`
        SELECT id, display_order_number, customer_name, customer_address, items, status, notes, created_at
        FROM orders
        WHERE site_id = ${id} AND status IN ('pending', 'accepted', 'preparing', 'ready')
        ORDER BY 
          CASE status 
            WHEN 'pending' THEN 1 
            WHEN 'accepted' THEN 2 
            WHEN 'preparing' THEN 3 
            WHEN 'ready' THEN 4 
          END,
          created_at ASC
      `
    } else if (role === "driver") {
      // Driver sees: ready orders (for pickup) and their active deliveries
      orders = await sql`
        SELECT id, display_order_number, customer_name, customer_phone, customer_address, 
               items, total, currency, payment_method, payment_status, status, notes, created_at
        FROM orders
        WHERE site_id = ${id} 
          AND customer_address IS NOT NULL
          AND (
            status = 'ready'
            OR (status = 'out_for_delivery' AND driver_id = ${driverId})
          )
        ORDER BY 
          CASE WHEN status = 'out_for_delivery' AND driver_id = ${driverId} THEN 0 ELSE 1 END,
          created_at ASC
      `
    } else {
      // Manager sees all active orders
      orders = await sql`
        SELECT id, display_order_number, customer_name, customer_phone, customer_address, 
               items, total, currency, payment_method, payment_status, status, notes, 
               driver_name, created_at
        FROM orders
        WHERE site_id = ${id} AND status NOT IN ('delivered', 'cancelled')
        ORDER BY 
          CASE status 
            WHEN 'pending' THEN 1 
            WHEN 'accepted' THEN 2 
            WHEN 'preparing' THEN 3 
            WHEN 'ready' THEN 4 
            WHEN 'out_for_delivery' THEN 5
          END,
          created_at ASC
      `
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
