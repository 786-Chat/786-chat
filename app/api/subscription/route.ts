import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getBuilderSubscription } from "@/lib/786-chat/billing"


// GET - Get user's subscription details
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const sub = await getBuilderSubscription(session.id)
    return NextResponse.json({
      plan: sub.plan,
      planName: sub.planConfig.name,
      status: sub.status,
      messagesUsed: sub.messages_used,
      messagesLimit: sub.messages_limit,
      messagesRemaining: Math.max(0, sub.messages_limit - sub.messages_used),
      extraCredits: sub.extra_credits,
      billingPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      currency: "GBP",
      features: sub.planConfig.features,
      entitlements: {
        projects: sub.planConfig.projects,
        deploymentsPerMonth: sub.planConfig.deploymentsPerMonth,
        customDomains: sub.planConfig.customDomains,
        teamMembers: sub.planConfig.teamMembers,
      },
    })
  } catch (error) {
    console.error("[MujeebProAI] Subscription fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({
    error: "Plan changes require Stripe Checkout. Use /api/stripe/checkout.",
  }, { status: 405, headers: { Allow: "GET" } })
}
