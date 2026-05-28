import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

// DeepSeek pricing per million tokens
const DEEPSEEK_INPUT_COST = 0.14  // $0.14 per million input tokens
const DEEPSEEK_OUTPUT_COST = 0.28 // $0.28 per million output tokens

interface AIRequest {
  type: "chat" | "website_edit" | "menu_help" | "business_content" | "code_help"
  message: string
  context?: string
}

// Get user from JWT token
async function getUser(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value || cookieStore.get("shop-token")?.value
  
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.userId as string,
      email: payload.email as string
    }
  } catch {
    return null
  }
}

// Get user's AI plan and usage
async function getUserPlanAndUsage(userId: string) {
  // Get user's plan from users table and pricing_plans
  const [userPlan] = await sql`
    SELECT 
      u.plan as plan_slug,
      p.plan_id,
      p.name as plan_name,
      p.messages_included as monthly_requests,
      p.messages_included * 1000 as monthly_tokens,
      2000 as max_output_tokens,
      p.features,
      p.extra_message_cost_gbp,
      p.allow_extra_messages
    FROM users u
    LEFT JOIN pricing_plans p ON p.plan_id = u.plan
    WHERE u.id = ${userId}::uuid
  `

  // Get current month usage
  const [usage] = await sql`
    SELECT 
      COALESCE(SUM(requests_count), 0) as total_requests,
      COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens,
      COALESCE(SUM(estimated_cost_usd), 0) as total_cost
    FROM user_ai_usage
    WHERE user_id = ${userId}::uuid
    AND date >= date_trunc('month', CURRENT_DATE)
  `

  return {
    subscription: userPlan ? {
      plan_id: userPlan.plan_id,
      plan_name: userPlan.plan_name,
      monthly_requests: Number(userPlan.monthly_requests) || 5,
      monthly_tokens: Number(userPlan.monthly_tokens) || 5000,
      max_output_tokens: userPlan.max_output_tokens || 2000,
      features: userPlan.features || [],
      extra_message_cost: Number(userPlan.extra_message_cost_gbp) || 0,
      allow_extra_messages: userPlan.allow_extra_messages || false
    } : null,
    usage: {
      totalRequests: Number(usage?.total_requests || 0),
      totalTokens: Number(usage?.total_tokens || 0),
      totalCost: Number(usage?.total_cost || 0)
    }
  }
}

// Check if user can make request - ALWAYS ALLOW for testing
function canMakeRequest(subscription: any, usage: any): { allowed: boolean; reason?: string } {
  // Allow all requests for testing - remove limits
  return { allowed: true }
}

// Calculate cost
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * DEEPSEEK_INPUT_COST
  const outputCost = (outputTokens / 1_000_000) * DEEPSEEK_OUTPUT_COST
  return inputCost + outputCost
}

// Get system prompt based on request type
function getSystemPrompt(type: string): string {
  switch (type) {
    case "website_edit":
      return `You are an expert web developer assistant. Help users modify their websites by providing clear, specific instructions or code snippets. Focus on HTML, CSS, and JavaScript changes. Be concise and practical.`
    case "menu_help":
      return `You are a menu and navigation design specialist. Help users create clear, user-friendly menus for websites and restaurants. Provide structured content with proper categories and descriptions.`
    case "business_content":
      return `You are a professional business content writer. Help create compelling product descriptions, about us pages, blog posts, and marketing copy. Write in a professional yet engaging tone.`
    case "code_help":
      return `You are an expert programmer. Help with HTML, CSS, JavaScript, React, and web development questions. Provide clean, well-commented code examples. Explain concepts clearly.`
    default:
      return `You are a helpful AI assistant for MujeebProAI, a website building and business management platform. Be helpful, concise, and professional.`
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: AIRequest = await request.json()
    const { type, message, context } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Check user plan and usage
    const { subscription, usage } = await getUserPlanAndUsage(user.id)
    const canRequest = canMakeRequest(subscription, usage)

    if (!canRequest.allowed) {
      return NextResponse.json({ 
        error: canRequest.reason,
        limitReached: true,
        usage: {
          requests: usage.totalRequests,
          maxRequests: subscription?.monthly_requests || 0,
          tokens: usage.totalTokens,
          maxTokens: subscription?.monthly_tokens || 0
        }
      }, { status: 429 })
    }

    // Get AI provider settings
    const [provider] = await sql`
      SELECT * FROM ai_provider_settings 
      WHERE is_primary = true AND is_enabled = true
      LIMIT 1
    `

    if (!provider) {
      return NextResponse.json({ error: "AI service not available" }, { status: 503 })
    }

    // Check for API key
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    // Build messages
    const systemPrompt = getSystemPrompt(type)
    const userMessage = context ? `Context: ${context}\n\nUser Request: ${message}` : message

    // Call DeepSeek API
    const response = await fetch(`${provider.base_url}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: Math.min(subscription?.max_output_tokens || 2000, provider.max_tokens),
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("DeepSeek API error:", errorData)
      
      // Log failed request
      await sql`
        INSERT INTO ai_request_logs (user_id, request_type, provider, model, input_text, status, error_message)
        VALUES (${user.id}::uuid, ${type}, 'deepseek', ${provider.model}, ${message.substring(0, 1000)}, 'error', ${errorData.error?.message || 'API error'})
      `
      
      return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 })
    }

    const data = await response.json()
    const responseTime = Date.now() - startTime
    
    const aiResponse = data.choices?.[0]?.message?.content || ""
    const inputTokens = data.usage?.prompt_tokens || 0
    const outputTokens = data.usage?.completion_tokens || 0
    const totalTokens = data.usage?.total_tokens || 0
    const cost = calculateCost(inputTokens, outputTokens)

    // Update usage tracking
    await sql`
      INSERT INTO user_ai_usage (user_id, date, requests_count, input_tokens, output_tokens, estimated_cost_usd)
      VALUES (${user.id}::uuid, CURRENT_DATE, 1, ${inputTokens}, ${outputTokens}, ${cost})
      ON CONFLICT (user_id, date) 
      DO UPDATE SET 
        requests_count = user_ai_usage.requests_count + 1,
        input_tokens = user_ai_usage.input_tokens + ${inputTokens},
        output_tokens = user_ai_usage.output_tokens + ${outputTokens},
        estimated_cost_usd = user_ai_usage.estimated_cost_usd + ${cost},
        updated_at = NOW()
    `

    // Log successful request
    await sql`
      INSERT INTO ai_request_logs (user_id, request_type, provider, model, input_text, output_text, input_tokens, output_tokens, total_tokens, cost_usd, response_time_ms, status)
      VALUES (${user.id}::uuid, ${type}, 'deepseek', ${provider.model}, ${message.substring(0, 1000)}, ${aiResponse.substring(0, 5000)}, ${inputTokens}, ${outputTokens}, ${totalTokens}, ${cost}, ${responseTime}, 'success')
    `

    return NextResponse.json({
      response: aiResponse,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost: cost.toFixed(6),
        requestsUsed: usage.totalRequests + 1,
        requestsLimit: subscription?.monthly_requests || 0,
        tokensUsed: usage.totalTokens + totalTokens,
        tokensLimit: subscription?.monthly_tokens || 0
      }
    })

  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get user's AI usage stats
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subscription, usage } = await getUserPlanAndUsage(user.id)

    // Get recent requests
    const recentRequests = await sql`
      SELECT id, request_type, input_tokens, output_tokens, cost_usd, created_at
      FROM ai_request_logs
      WHERE user_id = ${user.id}::uuid
      ORDER BY created_at DESC
      LIMIT 10
    `

    // Default free tier values
    const defaultPlan = {
      name: "Free Trial",
      monthlyRequests: 50,
      monthlyTokens: 100000,
      maxOutputTokens: 2000,
      features: ["chat"]
    }

    return NextResponse.json({
      plan: subscription ? {
        name: subscription.plan_name,
        monthlyRequests: subscription.monthly_requests,
        monthlyTokens: subscription.monthly_tokens,
        maxOutputTokens: subscription.max_output_tokens,
        features: subscription.features
      } : defaultPlan,
      usage: {
        requestsUsed: usage.totalRequests,
        requestsLimit: subscription?.monthly_requests || 50,
        requestsPercentage: Math.round((usage.totalRequests / (subscription?.monthly_requests || 50)) * 100),
        tokensUsed: usage.totalTokens,
        tokensLimit: subscription?.monthly_tokens || 100000,
        tokensPercentage: Math.round((usage.totalTokens / (subscription?.monthly_tokens || 100000)) * 100),
        totalCost: usage.totalCost.toFixed(4)
      },
      recentRequests
    })

  } catch (error) {
    console.error("AI usage API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
