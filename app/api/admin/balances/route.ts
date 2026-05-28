import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all user balances with user info
    const users = await sql`
      SELECT 
        ub.user_id as "userId",
        u.name as "userName",
        u.email as "userEmail",
        COALESCE(ub.balance, 0) as balance,
        COALESCE(ub.free_messages_used, 0) as "freeMessagesUsed",
        COALESCE(ub.free_messages_limit, 100) as "freeMessagesLimit",
        COALESCE(ub.total_messages_sent, 0) as "totalMessagesSent",
        COALESCE(ub.total_spent, 0) as "totalSpent"
      FROM users u
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      ORDER BY ub.total_spent DESC NULLS LAST
    `

    // Get stats
    const [statsResult] = await sql`
      SELECT 
        COUNT(DISTINCT u.id) as "totalUsers",
        COALESCE(SUM(ub.balance), 0) as "totalBalance",
        COALESCE(SUM(ub.total_spent), 0) as "totalSpent",
        COALESCE(SUM(ub.total_messages_sent), 0) as "totalMessages"
      FROM users u
      LEFT JOIN user_balances ub ON u.id = ub.user_id
    `

    // Get pricing settings
    const [pricing] = await sql`
      SELECT 
        cost_per_1000_messages as "costPer1000Messages",
        free_messages_default as "freeMessagesDefault",
        markup_percentage as "markupPercentage",
        topup_amounts as "topupAmounts"
      FROM ai_pricing_settings
      WHERE is_active = true
      LIMIT 1
    `

    return NextResponse.json({
      users: users.map(u => ({
        ...u,
        balance: Number(u.balance) || 0,
        totalSpent: Number(u.totalSpent) || 0,
      })),
      stats: {
        totalUsers: Number(statsResult?.totalUsers) || 0,
        totalBalance: Number(statsResult?.totalBalance) || 0,
        totalSpent: Number(statsResult?.totalSpent) || 0,
        totalMessages: Number(statsResult?.totalMessages) || 0,
      },
      pricing: pricing ? {
        costPer1000Messages: Number(pricing.costPer1000Messages) || 0.50,
        freeMessagesDefault: pricing.freeMessagesDefault || 100,
        markupPercentage: pricing.markupPercentage || 50,
        topupAmounts: pricing.topupAmounts || [5, 10, 20, 50],
      } : null,
    })
  } catch (error) {
    console.error("[Admin Balances] Error:", error)
    return NextResponse.json({ error: "Failed to fetch balances" }, { status: 500 })
  }
}
