import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayStats] = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE created_at >= ${today.toISOString()}) as today_orders,
        COALESCE(SUM(total) FILTER (WHERE created_at >= ${today.toISOString()} AND status = 'delivered'), 0) as today_revenue,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status IN ('accepted', 'preparing', 'ready', 'out_for_delivery')) as active_orders,
        COUNT(*) FILTER (WHERE status = 'delivered' AND created_at >= ${today.toISOString()}) as completed_today,
        COUNT(*) FILTER (WHERE status = 'cancelled' AND created_at >= ${today.toISOString()}) as cancelled_today
      FROM orders
      WHERE site_id = ${id}
    `

    return NextResponse.json({
      todayOrders: Number(todayStats?.today_orders || 0),
      todayRevenue: Number(todayStats?.today_revenue || 0),
      pendingOrders: Number(todayStats?.pending_orders || 0),
      activeOrders: Number(todayStats?.active_orders || 0),
      completedToday: Number(todayStats?.completed_today || 0),
      cancelledToday: Number(todayStats?.cancelled_today || 0),
    })
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
