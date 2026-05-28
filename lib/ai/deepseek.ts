// DeepSeek AI Integration Helper
// Cost: $0.14/million input, $0.28/million output tokens

import { sql } from "@/lib/db"

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AIRequestResult {
  success: boolean
  content?: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  costUsd?: number
  error?: string
  responseTimeMs?: number
}

// Get provider settings from database
export async function getProviderSettings(provider: string = "deepseek") {
  const [settings] = await sql`
    SELECT * FROM ai_provider_settings WHERE provider = ${provider} AND is_enabled = true
  `
  return settings
}

// Check user's plan limits
export async function checkUserLimits(userId: string): Promise<{
  allowed: boolean
  reason?: string
  remaining?: { requests: number; tokens: number }
}> {
  // Get user's subscription
  const [subscription] = await sql`
    SELECT uas.*, ap.monthly_requests, ap.monthly_tokens, ap.max_output_tokens, ap.name as plan_name
    FROM user_ai_subscriptions uas
    JOIN ai_plans ap ON uas.plan_id = ap.id
    WHERE uas.user_id = ${userId} AND uas.status = 'active'
    ORDER BY uas.created_at DESC
    LIMIT 1
  `

  if (!subscription) {
    return { allowed: false, reason: "No active AI subscription. Please subscribe to a plan." }
  }

  // Get current month's usage
  const [usage] = await sql`
    SELECT 
      COALESCE(SUM(requests_count), 0) as total_requests,
      COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens
    FROM user_ai_usage
    WHERE user_id = ${userId}
      AND date >= date_trunc('month', CURRENT_DATE)
  `

  const totalRequests = Number(usage?.total_requests || 0)
  const totalTokens = Number(usage?.total_tokens || 0)

  if (totalRequests >= subscription.monthly_requests) {
    return { 
      allowed: false, 
      reason: `Monthly request limit reached (${subscription.monthly_requests} requests). Upgrade your plan for more.`,
      remaining: { requests: 0, tokens: Math.max(0, subscription.monthly_tokens - totalTokens) }
    }
  }

  if (totalTokens >= subscription.monthly_tokens) {
    return { 
      allowed: false, 
      reason: `Monthly token limit reached (${subscription.monthly_tokens.toLocaleString()} tokens). Upgrade your plan for more.`,
      remaining: { requests: Math.max(0, subscription.monthly_requests - totalRequests), tokens: 0 }
    }
  }

  return { 
    allowed: true,
    remaining: {
      requests: subscription.monthly_requests - totalRequests,
      tokens: subscription.monthly_tokens - totalTokens
    }
  }
}

// Main function to call DeepSeek API
export async function callDeepSeek(
  userId: string,
  messages: DeepSeekMessage[],
  requestType: string = "chat",
  maxTokens: number = 2000
): Promise<AIRequestResult> {
  const startTime = Date.now()

  try {
    // Check provider settings
    const settings = await getProviderSettings("deepseek")
    if (!settings) {
      return { success: false, error: "DeepSeek AI is not enabled. Contact admin." }
    }

    // Check user limits
    const limits = await checkUserLimits(userId)
    if (!limits.allowed) {
      return { success: false, error: limits.reason }
    }

    // Get API key from environment
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return { success: false, error: "DeepSeek API key not configured" }
    }

    // Call DeepSeek API
    const response = await fetch(`${settings.base_url || "https://api.deepseek.com"}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || "deepseek-chat",
        messages,
        max_tokens: Math.min(maxTokens, settings.max_tokens || 4096),
        temperature: 0.7,
        stream: false
      })
    })

    const responseTimeMs = Date.now() - startTime

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || `API error: ${response.status}`
      
      // Log failed request
      await logRequest(userId, requestType, "deepseek", null, null, 0, 0, 0, responseTimeMs, "error", errorMsg)
      
      return { success: false, error: errorMsg, responseTimeMs }
    }

    const data: DeepSeekResponse = await response.json()
    const content = data.choices[0]?.message?.content || ""
    const inputTokens = data.usage?.prompt_tokens || 0
    const outputTokens = data.usage?.completion_tokens || 0
    const totalTokens = data.usage?.total_tokens || 0

    // Calculate cost (DeepSeek pricing)
    const inputCostPerMillion = Number(settings.input_cost_per_million) || 0.14
    const outputCostPerMillion = Number(settings.output_cost_per_million) || 0.28
    const costUsd = (inputTokens * inputCostPerMillion / 1000000) + (outputTokens * outputCostPerMillion / 1000000)

    // Log successful request
    await logRequest(userId, requestType, "deepseek", messages[messages.length - 1]?.content, content, inputTokens, outputTokens, costUsd, responseTimeMs, "success")

    // Update daily usage
    await updateDailyUsage(userId, inputTokens, outputTokens, costUsd)

    return {
      success: true,
      content,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd,
      responseTimeMs
    }
  } catch (error) {
    const responseTimeMs = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    
    await logRequest(userId, requestType, "deepseek", null, null, 0, 0, 0, responseTimeMs, "error", errorMsg)
    
    return { success: false, error: errorMsg, responseTimeMs }
  }
}

// Log request to database
async function logRequest(
  userId: string,
  requestType: string,
  provider: string,
  inputText: string | null,
  outputText: string | null,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
  responseTimeMs: number,
  status: string,
  errorMessage?: string
) {
  try {
    await sql`
      INSERT INTO ai_request_logs (
        user_id, request_type, provider, model, input_text, output_text,
        input_tokens, output_tokens, total_tokens, cost_usd, response_time_ms, status, error_message
      ) VALUES (
        ${userId}, ${requestType}, ${provider}, 'deepseek-chat',
        ${inputText?.substring(0, 5000)}, ${outputText?.substring(0, 10000)},
        ${inputTokens}, ${outputTokens}, ${inputTokens + outputTokens},
        ${costUsd}, ${responseTimeMs}, ${status}, ${errorMessage || null}
      )
    `
  } catch (err) {
    console.error("Failed to log AI request:", err)
  }
}

// Update daily usage
async function updateDailyUsage(userId: string, inputTokens: number, outputTokens: number, costUsd: number) {
  try {
    await sql`
      INSERT INTO user_ai_usage (user_id, date, requests_count, input_tokens, output_tokens, estimated_cost_usd)
      VALUES (${userId}, CURRENT_DATE, 1, ${inputTokens}, ${outputTokens}, ${costUsd})
      ON CONFLICT (user_id, date) DO UPDATE SET
        requests_count = user_ai_usage.requests_count + 1,
        input_tokens = user_ai_usage.input_tokens + ${inputTokens},
        output_tokens = user_ai_usage.output_tokens + ${outputTokens},
        estimated_cost_usd = user_ai_usage.estimated_cost_usd + ${costUsd},
        updated_at = NOW()
    `
  } catch (err) {
    console.error("Failed to update daily usage:", err)
  }
}

// Get user's current usage stats
export async function getUserUsageStats(userId: string) {
  const [todayUsage] = await sql`
    SELECT requests_count, input_tokens, output_tokens, estimated_cost_usd
    FROM user_ai_usage
    WHERE user_id = ${userId} AND date = CURRENT_DATE
  `

  const [monthlyUsage] = await sql`
    SELECT 
      COALESCE(SUM(requests_count), 0) as requests,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(estimated_cost_usd), 0) as cost
    FROM user_ai_usage
    WHERE user_id = ${userId}
      AND date >= date_trunc('month', CURRENT_DATE)
  `

  const [subscription] = await sql`
    SELECT ap.name, ap.monthly_requests, ap.monthly_tokens
    FROM user_ai_subscriptions uas
    JOIN ai_plans ap ON uas.plan_id = ap.id
    WHERE uas.user_id = ${userId} AND uas.status = 'active'
    ORDER BY uas.created_at DESC
    LIMIT 1
  `

  return {
    today: {
      requests: Number(todayUsage?.requests_count || 0),
      tokens: Number(todayUsage?.input_tokens || 0) + Number(todayUsage?.output_tokens || 0),
      cost: Number(todayUsage?.estimated_cost_usd || 0)
    },
    monthly: {
      requests: Number(monthlyUsage?.requests || 0),
      tokens: Number(monthlyUsage?.input_tokens || 0) + Number(monthlyUsage?.output_tokens || 0),
      cost: Number(monthlyUsage?.cost || 0)
    },
    plan: subscription ? {
      name: subscription.name,
      requestLimit: subscription.monthly_requests,
      tokenLimit: subscription.monthly_tokens
    } : null
  }
}
