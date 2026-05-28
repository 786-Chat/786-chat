import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET - Fetch orders for a site
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const token = request.cookies.get("auth_token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Verify user owns this site
    const sites = await sql`
      SELECT id FROM customer_sites 
      WHERE id = ${siteId} AND user_id = ${payload.id}
    `
    
    if (sites.length === 0) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let orders
    if (status && status !== "all") {
      orders = await sql`
        SELECT * FROM orders 
        WHERE site_id = ${siteId} AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      orders = await sql`
        SELECT * FROM orders 
        WHERE site_id = ${siteId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Get counts by status
    const counts = await sql`
      SELECT 
        status,
        COUNT(*)::int as count
      FROM orders 
      WHERE site_id = ${siteId}
      GROUP BY status
    `

    const statusCounts: Record<string, number> = {}
    counts.forEach((row: Record<string, unknown>) => {
      if (row.status && typeof row.status === 'string') {
        statusCounts[row.status] = Number(row.count) || 0
      }
    })

    return NextResponse.json({ 
      orders, 
      statusCounts,
      total: orders.length 
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// POST - Create a new order (public endpoint for customer website)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const body = await request.json()
    
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items,
      subtotal,
      deliveryFee = 0,
      tax = 0,
      total,
      currency = "GBP",
      paymentMethod,
      notes,
    } = body

    // Validate required fields
    if (!customerName || !items || items.length === 0 || !total) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get site settings for order prefix
    const settings = await sql`
      SELECT order_prefix FROM customer_site_settings WHERE site_id = ${siteId}
    `
    const orderPrefix = settings[0]?.order_prefix || "ORD"

    // Create the order
    const result = await sql`
      INSERT INTO orders (
        site_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        order_prefix,
        items,
        subtotal,
        delivery_fee,
        tax,
        total,
        currency,
        payment_method,
        notes,
        status,
        payment_status,
        pending_at
      ) VALUES (
        ${siteId},
        ${customerName},
        ${customerPhone || null},
        ${customerEmail || null},
        ${customerAddress || null},
        ${orderPrefix},
        ${JSON.stringify(items)},
        ${subtotal},
        ${deliveryFee},
        ${tax},
        ${total},
        ${currency},
        ${paymentMethod || "cash"},
        ${notes || null},
        'pending',
        'pending',
        NOW()
      )
      RETURNING *
    `

    const order = result[0]
    
    // Update display_order_number
    const displayOrderNumber = `${orderPrefix}-${String(order.order_number).padStart(4, "0")}`
    await sql`
      UPDATE orders SET display_order_number = ${displayOrderNumber} WHERE id = ${order.id}
    `

    return NextResponse.json({ 
      success: true, 
      order: { ...order, display_order_number: displayOrderNumber }
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

// PUT - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const token = request.cookies.get("auth_token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Verify user owns this site
    const sites = await sql`
      SELECT id FROM customer_sites 
      WHERE id = ${siteId} AND user_id = ${payload.id}
    `
    
    if (sites.length === 0) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const body = await request.json()
    const { orderId, status, cancellationReason, driverName, driverPhone, estimatedDeliveryTime } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 })
    }

    // Status timestamp mapping
    const statusTimestampMap: Record<string, string> = {
      pending: "pending_at",
      accepted: "accepted_at",
      preparing: "preparing_at",
      ready: "ready_at",
      out_for_delivery: "out_for_delivery_at",
      delivered: "delivered_at",
      cancelled: "cancelled_at",
    }

    const timestampField = statusTimestampMap[status]
    
    // Build update query based on status
    let result
    if (status === "cancelled") {
      result = await sql`
        UPDATE orders 
        SET status = ${status}, 
            cancelled_at = NOW(),
            cancellation_reason = ${cancellationReason || null},
            updated_at = NOW()
        WHERE id = ${orderId} AND site_id = ${siteId}
        RETURNING *
      `
    } else if (status === "out_for_delivery") {
      result = await sql`
        UPDATE orders 
        SET status = ${status}, 
            out_for_delivery_at = NOW(),
            driver_name = ${driverName || null},
            driver_phone = ${driverPhone || null},
            estimated_delivery_time = ${estimatedDeliveryTime || null},
            updated_at = NOW()
        WHERE id = ${orderId} AND site_id = ${siteId}
        RETURNING *
      `
    } else if (timestampField) {
      // Dynamic timestamp update based on status
      if (status === "accepted") {
        result = await sql`
          UPDATE orders SET status = ${status}, accepted_at = NOW(), updated_at = NOW()
          WHERE id = ${orderId} AND site_id = ${siteId} RETURNING *
        `
      } else if (status === "preparing") {
        result = await sql`
          UPDATE orders SET status = ${status}, preparing_at = NOW(), updated_at = NOW()
          WHERE id = ${orderId} AND site_id = ${siteId} RETURNING *
        `
      } else if (status === "ready") {
        result = await sql`
          UPDATE orders SET status = ${status}, ready_at = NOW(), updated_at = NOW()
          WHERE id = ${orderId} AND site_id = ${siteId} RETURNING *
        `
      } else if (status === "delivered") {
        result = await sql`
          UPDATE orders SET status = ${status}, delivered_at = NOW(), payment_status = 'paid', updated_at = NOW()
          WHERE id = ${orderId} AND site_id = ${siteId} RETURNING *
        `
      } else {
        result = await sql`
          UPDATE orders SET status = ${status}, updated_at = NOW()
          WHERE id = ${orderId} AND site_id = ${siteId} RETURNING *
        `
      }
    } else {
      result = await sql`
        UPDATE orders SET status = ${status}, updated_at = NOW()
        WHERE id = ${orderId} AND site_id = ${siteId} RETURNING *
      `
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, order: result[0] })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
