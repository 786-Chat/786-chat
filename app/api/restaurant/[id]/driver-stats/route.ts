import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID required" }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [stats] = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE driver_id = ${driverId} AND status = 'delivered' AND delivered_at >= ${today.toISOString()}) as today_deliveries,
        COALESCE(SUM(total) FILTER (WHERE driver_id = ${driverId} AND status = 'delivered' AND delivered_at >= ${today.toISOString()}), 0) as today_earnings,
        COUNT(*) FILTER (
          WHERE customer_address IS NOT NULL 
          AND (status = 'ready' OR (status = 'out_for_delivery' AND driver_id = ${driverId}))
        ) as pending_deliveries
      FROM orders
      WHERE site_id = ${id}
    `

    // Assume driver gets 10% of order total as earnings (configurable)
    const driverCut = 0.10

    return NextResponse.json({
      todayDeliveries: Number(stats?.today_deliveries || 0),
      todayEarnings: Math.round(Number(stats?.today_earnings || 0) * driverCut),
      pendingDeliveries: Number(stats?.pending_deliveries || 0),
    })
  } catch (error) {
    console.error("Failed to fetch driver stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
