import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

// Admin emails
const ADMIN_EMAILS = ["mujeeb@job4u.com", "admin@mujeebproai.com"]

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get total revenue
    const totalRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as transaction_count
      FROM revenue_logs
    `

    // Get revenue by type
    const revenueByType = await sql`
      SELECT 
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM revenue_logs
      GROUP BY type
    `

    // Get monthly revenue (last 12 months)
    const monthlyRevenue = await sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as transactions
      FROM revenue_logs
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `

    // Get recent transactions
    const recentTransactions = await sql`
      SELECT 
        r.id,
        r.amount,
        r.currency,
        r.type,
        r.plan_id,
        r.credits_added,
        r.created_at,
        u.name as user_name,
        u.email as user_email
      FROM revenue_logs r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 20
    `

    // Get subscription stats
    const subscriptionStats = await sql`
      SELECT 
        plan,
        status,
        COUNT(*) as count
      FROM subscriptions
      GROUP BY plan, status
    `

    // Calculate MRR (Monthly Recurring Revenue)
    const activeSubscriptions = await sql`
      SELECT plan, COUNT(*) as count
      FROM subscriptions
      WHERE status = 'active' AND plan != 'starter'
      GROUP BY plan
    `

    const planPrices: Record<string, number> = {
      basic: 10,
      pro: 20,
      business: 40,
      enterprise: 99
    }

    let mrr = 0
    for (const sub of activeSubscriptions) {
      mrr += (planPrices[sub.plan] || 0) * parseInt(sub.count)
    }

    return NextResponse.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      transactionCount: totalRevenue[0]?.transaction_count || 0,
      revenueByType,
      monthlyRevenue,
      recentTransactions,
      subscriptionStats,
      mrr
    })
  } catch (error) {
    console.error("Revenue API error:", error)
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 })
  }
}
