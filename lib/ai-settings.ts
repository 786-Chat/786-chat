import "server-only"
import { getSql } from "./db"

// DeepSeek pricing (per 1M tokens)
export const DEEPSEEK_PRICING = {
  "deepseek-chat": {
    input: 0.14,   // $0.14 per 1M input tokens
    output: 0.28,  // $0.28 per 1M output tokens
    cached: 0.014, // $0.014 per 1M cached input tokens
  },
  "deepseek-reasoner": {
    input: 0.55,   // $0.55 per 1M input tokens
    output: 2.19,  // $2.19 per 1M output tokens
    cached: 0.055, // $0.055 per 1M cached input tokens
  },
} as const

export type DeepSeekModel = keyof typeof DEEPSEEK_PRICING

export interface AISettings {
  id: string
  model: DeepSeekModel
  temperature: number
  maxTokens: number
  systemPrompt: string
  dailyMessageLimit: number
  monthlyTokenLimit: number
  autoBlockOnLimit: boolean
  monthlyBudgetUsd: number
  budgetAlertThreshold: number
  isActive: boolean
}

// Get current AI settings
export async function getAISettings(): Promise<AISettings> {
  const [settings] = await getSql()`
    SELECT 
      id,
      model,
      temperature,
      max_tokens as "maxTokens",
      system_prompt as "systemPrompt",
      daily_message_limit as "dailyMessageLimit",
      monthly_token_limit as "monthlyTokenLimit",
      auto_block_on_limit as "autoBlockOnLimit",
      monthly_budget_usd as "monthlyBudgetUsd",
      budget_alert_threshold as "budgetAlertThreshold",
      is_active as "isActive"
    FROM ai_settings
    LIMIT 1
  `

  if (!settings) {
    // Return defaults if no settings exist
    return {
      id: "",
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: "You are MujeebProAI, an advanced AI assistant created by Mujeeb Sardar.",
      dailyMessageLimit: 100,
      monthlyTokenLimit: 1000000,
      autoBlockOnLimit: true,
      monthlyBudgetUsd: 100,
      budgetAlertThreshold: 0.8,
      isActive: true,
    }
  }

  return {
    ...settings,
    temperature: Number(settings.temperature),
    monthlyBudgetUsd: Number(settings.monthlyBudgetUsd),
    budgetAlertThreshold: Number(settings.budgetAlertThreshold),
  }
}

// Update AI settings
export async function updateAISettings(
  settings: Partial<AISettings>,
  adminId: string
): Promise<boolean> {
  try {
    await getSql()`
      UPDATE ai_settings
      SET 
        model = COALESCE(${settings.model}, model),
        temperature = COALESCE(${settings.temperature}, temperature),
        max_tokens = COALESCE(${settings.maxTokens}, max_tokens),
        system_prompt = COALESCE(${settings.systemPrompt}, system_prompt),
        daily_message_limit = COALESCE(${settings.dailyMessageLimit}, daily_message_limit),
        monthly_token_limit = COALESCE(${settings.monthlyTokenLimit}, monthly_token_limit),
        auto_block_on_limit = COALESCE(${settings.autoBlockOnLimit}, auto_block_on_limit),
        monthly_budget_usd = COALESCE(${settings.monthlyBudgetUsd}, monthly_budget_usd),
        budget_alert_threshold = COALESCE(${settings.budgetAlertThreshold}, budget_alert_threshold),
        is_active = COALESCE(${settings.isActive}, is_active),
        updated_by = ${adminId}::uuid,
        updated_at = NOW()
    `
    return true
  } catch (error) {
    console.error("[AI Settings] Update error:", error)
    return false
  }
}

// Calculate cost for a request
export function calculateCost(
  model: DeepSeekModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = DEEPSEEK_PRICING[model] || DEEPSEEK_PRICING["deepseek-chat"]
  const inputCost = (inputTokens / 1000000) * pricing.input
  const outputCost = (outputTokens / 1000000) * pricing.output
  return inputCost + outputCost
}

// Track usage and cost
export async function trackUsage(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  model: DeepSeekModel
): Promise<void> {
  const cost = calculateCost(model, inputTokens, outputTokens)

  await getSql()`
    INSERT INTO ai_cost_tracking (user_id, date, messages_count, input_tokens, output_tokens, estimated_cost_usd, model)
    VALUES (${userId}::uuid, CURRENT_DATE, 1, ${inputTokens}, ${outputTokens}, ${cost}, ${model})
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
      messages_count = ai_cost_tracking.messages_count + 1,
      input_tokens = ai_cost_tracking.input_tokens + ${inputTokens},
      output_tokens = ai_cost_tracking.output_tokens + ${outputTokens},
      estimated_cost_usd = ai_cost_tracking.estimated_cost_usd + ${cost},
      updated_at = NOW()
  `
}

// Check if user has reached daily limit
export async function checkUserDailyLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const settings = await getAISettings()
  
  const [usage] = await getSql()`
    SELECT COALESCE(messages_count, 0) as count
    FROM ai_cost_tracking
    WHERE user_id = ${userId}::uuid AND date = CURRENT_DATE
  `

  const used = Number(usage?.count || 0)
  const allowed = !settings.autoBlockOnLimit || used < settings.dailyMessageLimit

  return { allowed, used, limit: settings.dailyMessageLimit }
}

// Check if user has reached monthly token limit
export async function checkUserMonthlyLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const settings = await getAISettings()
  
  const [usage] = await getSql()`
    SELECT COALESCE(SUM(input_tokens + output_tokens), 0) as tokens
    FROM ai_cost_tracking
    WHERE user_id = ${userId}::uuid 
    AND date >= date_trunc('month', CURRENT_DATE)
  `

  const used = Number(usage?.tokens || 0)
  const allowed = !settings.autoBlockOnLimit || used < settings.monthlyTokenLimit

  return { allowed, used, limit: settings.monthlyTokenLimit }
}

// Get cost summary
export async function getCostSummary(): Promise<{
  today: { cost: number; messages: number; tokens: number }
  thisMonth: { cost: number; messages: number; tokens: number }
  budget: { limit: number; used: number; percentage: number; alert: boolean }
}> {
  const settings = await getAISettings()

  const [todayStats] = await getSql()`
    SELECT 
      COALESCE(SUM(estimated_cost_usd), 0) as cost,
      COALESCE(SUM(messages_count), 0) as messages,
      COALESCE(SUM(input_tokens + output_tokens), 0) as tokens
    FROM ai_cost_tracking
    WHERE date = CURRENT_DATE
  `

  const [monthStats] = await getSql()`
    SELECT 
      COALESCE(SUM(estimated_cost_usd), 0) as cost,
      COALESCE(SUM(messages_count), 0) as messages,
      COALESCE(SUM(input_tokens + output_tokens), 0) as tokens
    FROM ai_cost_tracking
    WHERE date >= date_trunc('month', CURRENT_DATE)
  `

  const monthCost = Number(monthStats?.cost || 0)
  const budgetPercentage = settings.monthlyBudgetUsd > 0 
    ? (monthCost / settings.monthlyBudgetUsd) * 100 
    : 0

  return {
    today: {
      cost: Number(todayStats?.cost || 0),
      messages: Number(todayStats?.messages || 0),
      tokens: Number(todayStats?.tokens || 0),
    },
    thisMonth: {
      cost: monthCost,
      messages: Number(monthStats?.messages || 0),
      tokens: Number(monthStats?.tokens || 0),
    },
    budget: {
      limit: settings.monthlyBudgetUsd,
      used: monthCost,
      percentage: budgetPercentage,
      alert: budgetPercentage >= settings.budgetAlertThreshold * 100,
    },
  }
}

// Get cost per user
export async function getCostPerUser(): Promise<Array<{
  userId: string
  userName: string
  userEmail: string
  todayCost: number
  monthCost: number
  todayMessages: number
  monthMessages: number
}>> {
  const results = await getSql()`
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.email as user_email,
      COALESCE(today.cost, 0) as today_cost,
      COALESCE(month.cost, 0) as month_cost,
      COALESCE(today.messages, 0) as today_messages,
      COALESCE(month.messages, 0) as month_messages
    FROM users u
    LEFT JOIN (
      SELECT user_id, SUM(estimated_cost_usd) as cost, SUM(messages_count) as messages
      FROM ai_cost_tracking
      WHERE date = CURRENT_DATE
      GROUP BY user_id
    ) today ON today.user_id = u.id
    LEFT JOIN (
      SELECT user_id, SUM(estimated_cost_usd) as cost, SUM(messages_count) as messages
      FROM ai_cost_tracking
      WHERE date >= date_trunc('month', CURRENT_DATE)
      GROUP BY user_id
    ) month ON month.user_id = u.id
    WHERE today.cost > 0 OR month.cost > 0
    ORDER BY month.cost DESC NULLS LAST
    LIMIT 50
  `

  return results.map((r: any) => ({
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    todayCost: Number(r.today_cost),
    monthCost: Number(r.month_cost),
    todayMessages: Number(r.today_messages),
    monthMessages: Number(r.month_messages),
  }))
}
