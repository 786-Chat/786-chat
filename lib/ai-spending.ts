/**
 * AI Spending Tracker
 * Track and manage AI costs per user, per day, per month
 */

import { neon } from "@neondatabase/serverless"
import { AI_LIMITS, estimateMessageCost, usdToGbp } from "./ai-limits"

const sql = neon(process.env.DATABASE_URL!)

export interface SpendingRecord {
  userId: string
  inputTokens: number
  outputTokens: number
  imageCount: number
  pdfPages: number
  estimatedCostUsd: number
  estimatedCostGbp: number
  createdAt: Date
}

export interface UserSpending {
  userId: string
  email: string
  plan: string
  dailyMessages: number
  dailyCostGbp: number
  monthlyMessages: number
  monthlyCostGbp: number
  totalMessages: number
  totalCostGbp: number
}

export interface SystemSpending {
  todayMessages: number
  todayCostGbp: number
  monthMessages: number
  monthCostGbp: number
  totalMessages: number
  totalCostGbp: number
  topUsers: UserSpending[]
  budgetWarning: boolean
  budgetExceeded: boolean
}

/**
 * Track a message's AI cost
 */
export async function trackAICost(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  imageCount: number = 0,
  pdfPages: number = 0
): Promise<void> {
  const costUsd = estimateMessageCost(inputTokens, outputTokens, imageCount, pdfPages)
  const costGbp = usdToGbp(costUsd)

  await sql`
    INSERT INTO usage_logs (
      user_id, 
      action, 
      input_tokens, 
      output_tokens, 
      image_count, 
      pdf_pages,
      estimated_cost_usd,
      estimated_cost_gbp
    ) VALUES (
      ${userId}, 
      'ai_message', 
      ${inputTokens}, 
      ${outputTokens}, 
      ${imageCount}, 
      ${pdfPages},
      ${costUsd},
      ${costGbp}
    )
  `
}

/**
 * Get today's total AI spend
 */
export async function getTodaySpend(): Promise<{ messages: number; costGbp: number }> {
  const result = await sql`
    SELECT 
      COUNT(*) as message_count,
      COALESCE(SUM(estimated_cost_gbp), 0) as total_cost
    FROM usage_logs
    WHERE action = 'ai_message'
    AND created_at >= CURRENT_DATE
  `
  return {
    messages: Number(result[0]?.message_count || 0),
    costGbp: Number(result[0]?.total_cost || 0),
  }
}

/**
 * Get this month's total AI spend
 */
export async function getMonthSpend(): Promise<{ messages: number; costGbp: number }> {
  const result = await sql`
    SELECT 
      COUNT(*) as message_count,
      COALESCE(SUM(estimated_cost_gbp), 0) as total_cost
    FROM usage_logs
    WHERE action = 'ai_message'
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  `
  return {
    messages: Number(result[0]?.message_count || 0),
    costGbp: Number(result[0]?.total_cost || 0),
  }
}

/**
 * Check if budget limits are hit
 */
export async function checkBudgetLimits(): Promise<{
  warning: boolean
  exceeded: boolean
  todayCostGbp: number
}> {
  const { costGbp } = await getTodaySpend()
  const { warningThresholdGBP, hardLimitGBP, enableHardStop } = AI_LIMITS.budgetProtection

  return {
    warning: costGbp >= warningThresholdGBP,
    exceeded: enableHardStop && costGbp >= hardLimitGBP,
    todayCostGbp: costGbp,
  }
}

/**
 * Get spending by user for a time period
 */
export async function getUserSpending(
  userId: string,
  period: "day" | "month" | "all" = "month"
): Promise<{
  messages: number
  costGbp: number
  inputTokens: number
  outputTokens: number
}> {
  let dateFilter = ""
  if (period === "day") {
    dateFilter = "AND created_at >= CURRENT_DATE"
  } else if (period === "month") {
    dateFilter = "AND created_at >= DATE_TRUNC('month', CURRENT_DATE)"
  }

  const result = await sql`
    SELECT 
      COUNT(*) as message_count,
      COALESCE(SUM(estimated_cost_gbp), 0) as total_cost,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens
    FROM usage_logs
    WHERE user_id = ${userId}
    AND action = 'ai_message'
    ${period === "day" ? sql`AND created_at >= CURRENT_DATE` : sql``}
    ${period === "month" ? sql`AND created_at >= DATE_TRUNC('month', CURRENT_DATE)` : sql``}
  `

  return {
    messages: Number(result[0]?.message_count || 0),
    costGbp: Number(result[0]?.total_cost || 0),
    inputTokens: Number(result[0]?.input_tokens || 0),
    outputTokens: Number(result[0]?.output_tokens || 0),
  }
}

/**
 * Get top users by spending
 */
export async function getTopUsersBySpending(
  limit: number = 10,
  period: "day" | "month" | "all" = "month"
): Promise<UserSpending[]> {
  const result = await sql`
    SELECT 
      u.id as user_id,
      u.email,
      COALESCE(s.plan, 'starter') as plan,
      COUNT(CASE WHEN ul.created_at >= CURRENT_DATE THEN 1 END) as daily_messages,
      COALESCE(SUM(CASE WHEN ul.created_at >= CURRENT_DATE THEN ul.estimated_cost_gbp END), 0) as daily_cost,
      COUNT(CASE WHEN ul.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as monthly_messages,
      COALESCE(SUM(CASE WHEN ul.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN ul.estimated_cost_gbp END), 0) as monthly_cost,
      COUNT(*) as total_messages,
      COALESCE(SUM(ul.estimated_cost_gbp), 0) as total_cost
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    LEFT JOIN usage_logs ul ON u.id = ul.user_id AND ul.action = 'ai_message'
    GROUP BY u.id, u.email, s.plan
    ORDER BY 
      ${period === "day" ? sql`daily_cost` : period === "month" ? sql`monthly_cost` : sql`total_cost`} DESC
    LIMIT ${limit}
  `

  return result.map((row) => ({
    userId: row.user_id,
    email: row.email,
    plan: row.plan,
    dailyMessages: Number(row.daily_messages),
    dailyCostGbp: Number(row.daily_cost),
    monthlyMessages: Number(row.monthly_messages),
    monthlyCostGbp: Number(row.monthly_cost),
    totalMessages: Number(row.total_messages),
    totalCostGbp: Number(row.total_cost),
  }))
}

/**
 * Get full system spending report
 */
export async function getSystemSpendingReport(): Promise<SystemSpending> {
  const [todaySpend, monthSpend, topUsers] = await Promise.all([
    getTodaySpend(),
    getMonthSpend(),
    getTopUsersBySpending(10, "month"),
  ])

  // Get all-time totals
  const allTimeResult = await sql`
    SELECT 
      COUNT(*) as message_count,
      COALESCE(SUM(estimated_cost_gbp), 0) as total_cost
    FROM usage_logs
    WHERE action = 'ai_message'
  `

  const budgetStatus = await checkBudgetLimits()

  return {
    todayMessages: todaySpend.messages,
    todayCostGbp: todaySpend.costGbp,
    monthMessages: monthSpend.messages,
    monthCostGbp: monthSpend.costGbp,
    totalMessages: Number(allTimeResult[0]?.message_count || 0),
    totalCostGbp: Number(allTimeResult[0]?.total_cost || 0),
    topUsers,
    budgetWarning: budgetStatus.warning,
    budgetExceeded: budgetStatus.exceeded,
  }
}

/**
 * Get spending breakdown by plan
 */
export async function getSpendingByPlan(): Promise<
  Array<{ plan: string; users: number; messages: number; costGbp: number }>
> {
  const result = await sql`
    SELECT 
      COALESCE(s.plan, 'starter') as plan,
      COUNT(DISTINCT u.id) as user_count,
      COUNT(ul.id) as message_count,
      COALESCE(SUM(ul.estimated_cost_gbp), 0) as total_cost
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    LEFT JOIN usage_logs ul ON u.id = ul.user_id AND ul.action = 'ai_message'
      AND ul.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY s.plan
    ORDER BY total_cost DESC
  `

  return result.map((row) => ({
    plan: row.plan || "starter",
    users: Number(row.user_count),
    messages: Number(row.message_count),
    costGbp: Number(row.total_cost),
  }))
}
