import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "admin@mujeebproai.com").split(",").map(e => e.trim().toLowerCase())

async function isAdmin(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  
  if (!token) return false
  
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const email = (payload.email as string).toLowerCase()
    return ADMIN_EMAILS.includes(email)
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Today's stats
    const [todayStats] = await sql`
      SELECT 
        COALESCE(SUM(requests_count), 0) as requests,
        COALESCE(SUM(estimated_cost_usd), 0) as cost
      FROM user_ai_usage
      WHERE date = CURRENT_DATE
    `

    // Month's stats
    const [monthStats] = await sql`
      SELECT 
        COALESCE(SUM(requests_count), 0) as requests,
        COALESCE(SUM(estimated_cost_usd), 0) as cost
      FROM user_ai_usage
      WHERE date >= date_trunc('month', CURRENT_DATE)
    `

    // Active subscriptions count
    const [subCount] = await sql`
      SELECT COUNT(*) as count FROM user_ai_subscriptions WHERE status = 'active'
    `

    // Daily stats for the last 30 days
    const dailyStats = await sql`
      SELECT 
        TO_CHAR(date, 'MM/DD') as date,
        SUM(requests_count) as requests,
        SUM(estimated_cost_usd) as cost,
        SUM(input_tokens + output_tokens) as tokens
      FROM user_ai_usage
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date ASC
    `

    // Top 10 users by cost
    const topUsers = await sql`
      SELECT 
        u.user_id,
        COALESCE(cu.email, su.email, 'Unknown') as email,
        SUM(u.requests_count) as total_requests,
        SUM(u.input_tokens + u.output_tokens) as total_tokens,
        SUM(u.estimated_cost_usd) as total_cost
      FROM user_ai_usage u
      LEFT JOIN customer_users cu ON u.user_id = cu.id
      LEFT JOIN shop_users su ON u.user_id = su.id
      WHERE u.date >= date_trunc('month', CURRENT_DATE)
      GROUP BY u.user_id, cu.email, su.email
      ORDER BY total_cost DESC
      LIMIT 10
    `

    // AI providers
    const providers = await sql`
      SELECT provider, is_enabled, is_primary, model, input_cost_per_million, output_cost_per_million
      FROM ai_provider_settings
      ORDER BY is_primary DESC, provider ASC
    `

    return NextResponse.json({
      stats: {
        todayRequests: Number(todayStats?.requests || 0),
        todayCost: Number(todayStats?.cost || 0),
        monthRequests: Number(monthStats?.requests || 0),
        monthCost: Number(monthStats?.cost || 0),
        activeSubscriptions: Number(subCount?.count || 0)
      },
      dailyStats: dailyStats.map(d => ({
        date: d.date,
        requests: Number(d.requests),
        cost: Number(d.cost),
        tokens: Number(d.tokens)
      })),
      topUsers: topUsers.map(u => ({
        user_id: u.user_id,
        email: u.email,
        total_requests: Number(u.total_requests),
        total_tokens: Number(u.total_tokens),
        total_cost: Number(u.total_cost)
      })),
      providers
    })

  } catch (error) {
    console.error("Admin AI usage API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
