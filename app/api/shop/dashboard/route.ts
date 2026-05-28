import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("shop-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const siteId = payload.siteId as string

    // Get site info
    const [siteInfo] = await sql`
      SELECT 
        cs.id, cs.site_name, cs.subdomain, cs.is_active, cs.is_locked,
        css.is_open, css.payment_status
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      WHERE cs.id = ${siteId}
    `

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's stats
    const [todayStats] = await sql`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue
      FROM orders
      WHERE site_id = ${siteId}
        AND created_at >= ${today.toISOString()}
        AND created_at < ${tomorrow.toISOString()}
    `

    // Get order counts by status
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE site_id = ${siteId}
        AND created_at >= ${today.toISOString()}
        AND created_at < ${tomorrow.toISOString()}
      GROUP BY status
    `

    const statusMap: Record<string, number> = {}
    statusCounts.forEach((row: { status: string; count: number }) => {
      statusMap[row.status] = Number(row.count)
    })

    // Get recent orders
    const recentOrders = await sql`
      SELECT id, order_number, display_order_number, customer_name, status, total, created_at
      FROM orders
      WHERE site_id = ${siteId}
      ORDER BY created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      siteInfo,
      stats: {
        todayOrders: Number(todayStats?.total_orders || 0),
        todayRevenue: Number(todayStats?.total_revenue || 0),
        pendingOrders: statusMap["pending"] || 0,
        preparingOrders: statusMap["preparing"] || 0,
        readyOrders: statusMap["ready"] || 0,
        deliveredOrders: statusMap["delivered"] || 0,
        cancelledOrders: statusMap["cancelled"] || 0
      },
      recentOrders
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
