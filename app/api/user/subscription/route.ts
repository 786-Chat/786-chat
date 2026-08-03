import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getBuilderSubscription } from "@/lib/786-chat/billing"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const subscription = await getBuilderSubscription(session.id)
    return NextResponse.json({
      plan: subscription.plan,
      plan_name: subscription.planConfig.name,
      messages_used: subscription.messages_used,
      messages_limit: subscription.messages_limit,
      extra_credits: subscription.extra_credits,
      status: subscription.status,
      stripe_subscription_id: subscription.stripe_subscription_id || null,
      current_period_end: subscription.current_period_end || null,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      features: subscription.planConfig.features,
      entitlements: {
        projects: subscription.planConfig.projects,
        deployments_per_month: subscription.planConfig.deploymentsPerMonth,
        custom_domains: subscription.planConfig.customDomains,
        team_members: subscription.planConfig.teamMembers,
      },
    })
  } catch (error) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    )
  }
}
