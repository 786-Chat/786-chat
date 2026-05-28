import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { BILLING_PLANS, type PlanId } from "@/lib/billing"


// GET - Get user's current usage
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user's subscription
    const subscriptions = await sql`
      SELECT * FROM subscriptions WHERE user_id = ${payload.id}
    `

    if (subscriptions.length === 0) {
      // Create default subscription for user
      await sql`
        INSERT INTO subscriptions (user_id, plan, messages_used, messages_limit, status)
        VALUES (${payload.id}, 'starter', 0, 5, 'active')
      `
      
      return NextResponse.json({
        plan: "starter",
        messagesUsed: 0,
        messagesLimit: 5,
        messagesRemaining: 5,
        extraUsageCost: 0,
        canSendMessage: true,
        requiresUpgrade: false
      })
    }

    const subscription = subscriptions[0]
    const plan = subscription.plan as PlanId
    const planConfig = BILLING_PLANS[plan]
    const messagesUsed = subscription.messages_used || 0
    const messagesLimit = planConfig.messagesIncluded
    const messagesRemaining = Math.max(0, messagesLimit - messagesUsed)
    
    // Check if user can send messages
    const canSendMessage = plan === "starter" 
      ? messagesUsed < 5 
      : planConfig.allowExtraMessages || messagesRemaining > 0

    return NextResponse.json({
      plan,
      messagesUsed,
      messagesLimit,
      messagesRemaining,
      extraUsageCost: subscription.extra_usage_cost || 0,
      canSendMessage,
      requiresUpgrade: plan === "starter" && messagesUsed >= 5
    })
  } catch (error) {
    console.error("[v0] Usage fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 })
  }
}

// POST - Record usage (called when sending AI message)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { action = "ai_message", tokensUsed = 1 } = await request.json()

    // Get user's subscription
    const subscriptions = await sql`
      SELECT * FROM subscriptions WHERE user_id = ${payload.id}
    `

    let subscription = subscriptions[0]
    
    if (!subscription) {
      // Create default subscription
      const newSub = await sql`
        INSERT INTO subscriptions (user_id, plan, messages_used, messages_limit, status)
        VALUES (${payload.id}, 'starter', 0, 5, 'active')
        RETURNING *
      `
      subscription = newSub[0]
    }

    const plan = subscription.plan as PlanId
    const planConfig = BILLING_PLANS[plan]
    const currentUsed = subscription.messages_used || 0

    // Check if starter plan user has exceeded limit
    if (plan === "starter" && currentUsed >= 5) {
      return NextResponse.json({
        error: "Free trial exceeded",
        requiresUpgrade: true,
        messagesUsed: currentUsed,
        messagesLimit: 5
      }, { status: 403 })
    }

    // Calculate extra cost if applicable
    let extraCost = 0
    const newMessagesUsed = currentUsed + tokensUsed
    
    if (planConfig.allowExtraMessages && newMessagesUsed > planConfig.messagesIncluded) {
      const extraMessages = Math.min(tokensUsed, newMessagesUsed - planConfig.messagesIncluded)
      extraCost = extraMessages * planConfig.extraMessageCost.GBP // Using GBP as default
    }

    // Update subscription usage
    await sql`
      UPDATE subscriptions 
      SET 
        messages_used = messages_used + ${tokensUsed},
        extra_usage_cost = extra_usage_cost + ${extraCost},
        updated_at = NOW()
      WHERE user_id = ${payload.id}
    `

    // Log usage
    await sql`
      INSERT INTO usage_logs (user_id, action, tokens_used, cost)
      VALUES (${payload.id}, ${action}, ${tokensUsed}, ${extraCost})
    `

    const messagesRemaining = Math.max(0, planConfig.messagesIncluded - newMessagesUsed)

    return NextResponse.json({
      success: true,
      messagesUsed: newMessagesUsed,
      messagesRemaining,
      extraCost,
      requiresUpgrade: plan === "starter" && newMessagesUsed >= 5
    })
  } catch (error) {
    console.error("[v0] Usage record error:", error)
    return NextResponse.json({ error: "Failed to record usage" }, { status: 500 })
  }
}
