import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getSystemSpendingReport, getSpendingByPlan, getTodaySpend, getMonthSpend } from "@/lib/ai-spending"
import { unblockUser, blockUser, suspendUser, addExtraCredits } from "@/lib/ai-protection"
import { AI_LIMITS } from "@/lib/ai-limits"


// GET - Get admin usage dashboard data
export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await getSql()`
      SELECT role FROM users WHERE id = ${session.id}
    `

    if (user[0]?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get("view")

    // Main dashboard view
    if (!view || view === "dashboard") {
      const [spendingReport, spendingByPlan, todaySpend, monthSpend] = await Promise.all([
        getSystemSpendingReport(),
        getSpendingByPlan(),
        getTodaySpend(),
        getMonthSpend(),
      ])

      // Get subscription stats
      const subscriptionStats = await getSql()`
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

      // Get revenue estimate (monthly)
      const revenueStats = await getSql()`
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

      // Get failed requests in last 24h
      const failedRequests = await getSql()`
        SELECT 
          COALESCE(metadata->>'errorCode', 'unknown') as error_code,
          COUNT(*) as count
        FROM usage_logs
        WHERE action = 'ai_error'
        AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY metadata->>'errorCode'
        ORDER BY count DESC
        LIMIT 20
      `

      // Get active users (last 24h)
      const activeUsers = await getSql()`
        SELECT COUNT(DISTINCT user_id) as count
        FROM usage_logs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `

      // Get blocked users
      const blockedUsers = await getSql()`
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

      // Calculate total monthly revenue
      const totalRevenue = revenueStats.reduce(
        (sum, row) => sum + Number(row.monthly_revenue_gbp || 0),
        0
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

    // Top users view
    if (view === "topUsers") {
      const topUsers = await getSql()`
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

    // Blocked users view
    if (view === "blocked") {
      const blocked = await getSql()`
        SELECT rl.*, u.email, u.name
        FROM rate_limits rl
        JOIN users u ON rl.user_id = u.id
        WHERE rl.is_blocked = TRUE AND rl.action = 'chat'
        ORDER BY rl.updated_at DESC
      `
      return NextResponse.json({ blocked })
    }

    // Specific user view
    const userId = searchParams.get("userId")
    if (userId) {
      const userInfo = await getSql()`
        SELECT id, email, name, role, created_at
        FROM users WHERE id = ${userId}::uuid
      `
      
      const subscription = await getSql()`
        SELECT * FROM subscriptions WHERE user_id = ${userId}::uuid
      `
      
      const rateLimits = await getSql()`
        SELECT * FROM rate_limits WHERE user_id = ${userId}::uuid
      `
      
      const recentUsage = await getSql()`
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
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await getSql()`
      SELECT role FROM users WHERE id = ${session.id}
    `

    if (user[0]?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action, userId, reason, credits, durationMinutes } = body

    // Log all admin actions
    const logAdminAction = async (actionType: string, details: object) => {
      await getSql()`
        INSERT INTO usage_logs (user_id, action, metadata)
        VALUES (${session.id}, ${`admin_${actionType}`}, ${JSON.stringify({ targetUserId: userId, ...details })})
      `
    }

    switch (action) {
      case "unblock":
        await unblockUser(userId)
        await logAdminAction("unblock", { reason })
        return NextResponse.json({ success: true, message: "User unblocked" })

      case "block":
        await blockUser(userId, reason || "Blocked by admin", durationMinutes || 60)
        await logAdminAction("block", { reason, durationMinutes })
        return NextResponse.json({ success: true, message: "User blocked" })

      case "suspend":
        await suspendUser(userId, reason || "Suspended by admin")
        await logAdminAction("suspend", { reason })
        return NextResponse.json({ success: true, message: "User suspended" })

      case "add_credits":
        if (!credits || credits < 1 || credits > 10000) {
          return NextResponse.json({ error: "Invalid credit amount (1-10000)" }, { status: 400 })
        }
        await addExtraCredits(userId, credits)
        await logAdminAction("add_credits", { credits })
        return NextResponse.json({ success: true, message: `Added ${credits} credits` })

      case "reset_usage":
        await getSql()`
          UPDATE subscriptions
          SET messages_used = 0, daily_messages_used = 0, updated_at = NOW()
          WHERE user_id = ${userId}::uuid
        `
        await logAdminAction("reset_usage", {})
        return NextResponse.json({ success: true, message: "Usage reset" })

      case "reset_spam":
        await getSql()`
          UPDATE rate_limits
          SET spam_score = 0
          WHERE user_id = ${userId}::uuid AND action = 'chat'
        `
        await logAdminAction("reset_spam", {})
        return NextResponse.json({ success: true, message: "Spam score reset" })

      case "set_plan":
        const { plan, messagesLimit } = body
        if (!["starter", "basic", "pro", "business", "enterprise"].includes(plan)) {
          return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
        }
        await getSql()`
          UPDATE subscriptions
          SET plan = ${plan}, messages_limit = ${messagesLimit || null}, updated_at = NOW()
          WHERE user_id = ${userId}::uuid
        `
        await logAdminAction("set_plan", { plan, messagesLimit })
        return NextResponse.json({ success: true, message: `Plan set to ${plan}` })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Admin Usage] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
