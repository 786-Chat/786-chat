import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { BILLING_PLANS, type PlanId } from "@/lib/billing"


// GET - Get user's subscription details
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

    const subscriptions = await getSql()`
      SELECT s.*, u.email, u.name, u.currency, u.language
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ${payload.id}
    `

    if (subscriptions.length === 0) {
      return NextResponse.json({
        plan: "starter",
        status: "active",
        messagesUsed: 0,
        messagesLimit: 5,
        extraUsageCost: 0,
        currency: "GBP"
      })
    }

    const sub = subscriptions[0]
    const plan = sub.plan as PlanId
    const planConfig = BILLING_PLANS[plan]

    return NextResponse.json({
      plan,
      planName: planConfig.name,
      status: sub.status,
      messagesUsed: sub.messages_used || 0,
      messagesLimit: planConfig.messagesIncluded,
      messagesRemaining: Math.max(0, planConfig.messagesIncluded - (sub.messages_used || 0)),
      extraUsageCost: sub.extra_usage_cost || 0,
      billingPeriodStart: sub.billing_period_start,
      currentPeriodEnd: sub.current_period_end,
      currency: sub.currency || "GBP",
      features: planConfig.features
    })
  } catch (error) {
    console.error("[v0] Subscription fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}

// POST - Upgrade subscription (simulate for now, Stripe integration later)
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

    const { planId } = await request.json()

    if (!planId || !BILLING_PLANS[planId as PlanId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const newPlan = BILLING_PLANS[planId as PlanId]

    // Update subscription
    await getSql()`
      UPDATE subscriptions 
      SET 
        plan = ${planId},
        messages_limit = ${newPlan.messagesIncluded},
        messages_used = 0,
        extra_usage_cost = 0,
        billing_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
      WHERE user_id = ${payload.id}
    `

    return NextResponse.json({
      success: true,
      plan: planId,
      messagesLimit: newPlan.messagesIncluded,
      message: `Successfully upgraded to ${newPlan.name} plan`
    })
  } catch (error) {
    console.error("[v0] Subscription upgrade error:", error)
    return NextResponse.json({ error: "Failed to upgrade subscription" }, { status: 500 })
  }
}
