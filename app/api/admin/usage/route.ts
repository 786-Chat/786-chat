import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getSystemSpendingReport, getSpendingByPlan, getTodaySpend, getMonthSpend } from "@/lib/ai-spending"
import { unblockUser, blockUser, suspendUser, addExtraCredits } from "@/lib/ai-protection"
import { AI_LIMITS } from "@/lib/ai-limits"

async function requireAdminSession() {
  const session = await getSession()
  if (!session) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const user = await sql`SELECT role FROM users WHERE id = ${session.id}`
  if (user[0]?.role !== "admin") {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { session }
}

// GET - Get admin usage dashboard data
export async function GET(request: Request) {
  try {
    const auth = await requireAdminSession()
    if ("response" in auth) return auth.response

    const { searchParams } = new URL(request.url)
    const view = searchParams.get("view")

    if (!view || view === "dashboard") {
      const [spendingReport, spendingByPlan, todaySpend, monthSpend] = await Promise.all([
        getSystemSpendingReport(),
        getSpendingByPlan(),
        getTodaySpend(),
        getMonthSpend(),
      ])

      const subscriptionStats = await sql`
        SELECT
          plan,
          status,
          COUNT(*) as count,
          SUM(messages_used) as total_messages_used,
          SUM(messages_limit) as total_messages_limit
        FROM subscriptions
        GROUP BY plan, status
        ORDER BY plan, status
      `

      const revenueStats = await sql`
        SELECT
          plan,
          COUNT(*) as subscriber_count,
          CASE plan
            WHEN 'basic' THEN COUNT(*) * 10
            WHEN 'pro' THEN COUNT(*) * 20
            WHEN 'business' THEN COUNT(*) * 40
            WHEN 'enterprise' THEN COUNT(*) * 99
            ELSE 0
          END as monthly_revenue_gbp
        FROM subscriptions
        WHERE status = 'active'
        GROUP BY plan
      `

      // The production usage_logs table intentionally stores compact counters only.
      // Older code queried a non-existent metadata column and made Admin > AI Usage fail.
      const failedRequests = await sql`
        SELECT 'ai_error'::text as error_code, COUNT(*) as count
        FROM usage_logs
        WHERE action = 'ai_error'
          AND created_at > NOW() - INTERVAL '24 hours'
        HAVING COUNT(*) > 0
      `

      const activeUsers = await sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM usage_logs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `

      const blockedUsers = await sql`
        SELECT
          r.user_id,
          u.email,
          u.name,
          r.block_reason,
          r.blocked_until,
          r.spam_score
        FROM rate_limits r
        JOIN users u ON r.user_id = u.id
        WHERE r.is_blocked = TRUE AND r.action = 'chat'
        ORDER BY r.updated_at DESC
        LIMIT 50
      `

      const totalRevenue = revenueStats.reduce(
        (sum, row) => sum + Number(row.monthly_revenue_gbp || 0),
        0,
      )

      return NextResponse.json({
        spending: {
          today: todaySpend,
          month: monthSpend,
          total: {
            messages: spendingReport.totalMessages,
            costGbp: spendingReport.totalCostGbp,
          },
          topUsers: spendingReport.topUsers,
        },
        spendingByPlan,
        subscriptions: subscriptionStats,
        revenue: {
          byPlan: revenueStats,
          totalMonthlyGbp: totalRevenue,
        },
        failedRequests,
        activeUsersLast24h: Number(activeUsers[0]?.count || 0),
        blockedUsers,
        budgetStatus: {
          warning: spendingReport.budgetWarning,
          exceeded: spendingReport.budgetExceeded,
          todayCostGbp: todaySpend.costGbp,
          warningThreshold: AI_LIMITS.budgetProtection.warningThresholdGBP,
          hardLimit: AI_LIMITS.budgetProtection.hardLimitGBP,
        },
      })
    }

    if (view === "topUsers") {
      const topUsers = await sql`
        SELECT
          u.id, u.email, u.name,
          s.plan, s.messages_used, s.messages_limit, s.extra_credits,
          COALESCE(SUM(ul.estimated_cost_gbp), 0) as total_cost_gbp,
          COUNT(ul.id) as total_messages
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        LEFT JOIN usage_logs ul ON u.id = ul.user_id AND ul.action = 'ai_message'
        GROUP BY u.id, u.email, u.name, s.plan, s.messages_used, s.messages_limit, s.extra_credits
        ORDER BY total_cost_gbp DESC
        LIMIT 100
      `
      return NextResponse.json({ topUsers })
    }

    if (view === "blocked") {
      const blocked = await sql`
        SELECT rl.*, u.email, u.name
        FROM rate_limits rl
        JOIN users u ON rl.user_id = u.id
        WHERE rl.is_blocked = TRUE AND rl.action = 'chat'
        ORDER BY rl.updated_at DESC
      `
      return NextResponse.json({ blocked })
    }

    const userId = searchParams.get("userId")
    if (userId) {
      const userInfo = await sql`
        SELECT id, email, name, role, created_at
        FROM users WHERE id = ${userId}::uuid
      `

      const subscription = await sql`
        SELECT * FROM subscriptions WHERE user_id = ${userId}::uuid
      `

      const rateLimits = await sql`
        SELECT * FROM rate_limits WHERE user_id = ${userId}::uuid
      `

      const recentUsage = await sql`
        SELECT * FROM usage_logs
        WHERE user_id = ${userId}::uuid
        ORDER BY created_at DESC
        LIMIT 50
      `

      return NextResponse.json({
        user: userInfo[0],
        subscription: subscription[0],
        rateLimits,
        recentUsage,
      })
    }

    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 })
  } catch (error) {
    console.error("[Admin Usage] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Admin actions
export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession()
    if ("response" in auth) return auth.response
    const { session } = auth

    const body = await request.json()
    const { action, userId, reason, credits, durationMinutes } = body

    // Keep the audit event compatible with the compact production usage_logs schema.
    const logAdminAction = async (actionType: string) => {
      await sql`
        INSERT INTO usage_logs (
          user_id, action, tokens_used, cost, input_tokens, output_tokens,
          image_count, pdf_pages, estimated_cost_usd, estimated_cost_gbp
        )
        VALUES (
          ${session.id}, ${`admin_${actionType}`}, 0, 0, 0, 0, 0, 0, 0, 0
        )
      `
    }

    switch (action) {
      case "unblock":
        await unblockUser(userId)
        await logAdminAction("unblock")
        return NextResponse.json({ success: true, message: "User unblocked" })

      case "block":
        await blockUser(userId, reason || "Blocked by admin", durationMinutes || 60)
        await logAdminAction("block")
        return NextResponse.json({ success: true, message: "User blocked" })

      case "suspend":
        await suspendUser(userId, reason || "Suspended by admin")
        await logAdminAction("suspend")
        return NextResponse.json({ success: true, message: "User suspended" })

      case "add_credits":
        if (!credits || credits < 1 || credits > 10000) {
          return NextResponse.json({ error: "Invalid credit amount (1-10000)" }, { status: 400 })
        }
        await addExtraCredits(userId, credits)
        await logAdminAction("add_credits")
        return NextResponse.json({ success: true, message: `Added ${credits} credits` })

      case "reset_usage":
        await sql`
          UPDATE subscriptions
          SET messages_used = 0, daily_messages_used = 0, tokens_used = 0, updated_at = NOW()
          WHERE user_id = ${userId}::uuid
        `
        await logAdminAction("reset_usage")
        return NextResponse.json({ success: true, message: "Usage reset" })

      case "reset_spam":
        await sql`
          UPDATE rate_limits
          SET spam_score = 0
          WHERE user_id = ${userId}::uuid AND action = 'chat'
        `
        await logAdminAction("reset_spam")
        return NextResponse.json({ success: true, message: "Spam score reset" })

      case "set_plan": {
        const { plan, messagesLimit } = body
        if (!["starter", "basic", "pro", "business", "enterprise"].includes(plan)) {
          return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
        }
        await sql`
          UPDATE subscriptions
          SET plan = ${plan}, messages_limit = ${messagesLimit || null}, updated_at = NOW()
          WHERE user_id = ${userId}::uuid
        `
        await logAdminAction("set_plan")
        return NextResponse.json({ success: true, message: `Plan set to ${plan}` })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Admin Usage] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
