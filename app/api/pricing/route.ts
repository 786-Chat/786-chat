import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { BILLING_PLANS, type PlanId } from "@/lib/billing"

const sql = neon(process.env.DATABASE_URL!)

// GET - Fetch pricing plans (combines DB overrides with defaults)
export async function GET() {
  try {
    // Try to get pricing from database (admin-configurable)
    const dbPlans = await sql`
      SELECT * FROM pricing_plans ORDER BY sort_order ASC
    `.catch(() => [])

    // If database has plans, use those
    if (dbPlans.length > 0) {
      const plans = dbPlans.map(plan => ({
        id: plan.plan_id,
        name: plan.name,
        price: {
          GBP: parseFloat(plan.price_gbp) || 0,
          USD: parseFloat(plan.price_usd) || 0,
          EUR: parseFloat(plan.price_eur) || 0,
          PKR: parseFloat(plan.price_pkr) || 0,
        },
        messagesIncluded: plan.messages_included || 0,
        extraMessageCost: {
          GBP: parseFloat(plan.extra_message_cost_gbp) || 0,
          USD: parseFloat(plan.extra_message_cost_usd) || 0,
          EUR: parseFloat(plan.extra_message_cost_eur) || 0,
          PKR: parseFloat(plan.extra_message_cost_pkr) || 0,
        },
        features: plan.features || [],
        isPopular: plan.is_popular || false,
        allowExtraMessages: plan.allow_extra_messages || false,
        isActive: plan.is_active !== false,
      }))

      return NextResponse.json({ plans, source: "database" })
    }

    // Fallback to hardcoded plans from billing.ts
    const plans = Object.entries(BILLING_PLANS).map(([id, plan]) => ({
      id,
      name: plan.name,
      price: plan.price,
      messagesIncluded: plan.messagesIncluded,
      extraMessageCost: plan.extraMessageCost,
      features: plan.features,
      isPopular: plan.isPopular,
      allowExtraMessages: plan.allowExtraMessages,
      isActive: true,
    }))

    return NextResponse.json({ plans, source: "config" })
  } catch (error) {
    console.error("[Pricing API] Error:", error)
    
    // Return hardcoded plans as fallback
    const plans = Object.entries(BILLING_PLANS).map(([id, plan]) => ({
      id,
      name: plan.name,
      price: plan.price,
      messagesIncluded: plan.messagesIncluded,
      extraMessageCost: plan.extraMessageCost,
      features: plan.features,
      isPopular: plan.isPopular,
      allowExtraMessages: plan.allowExtraMessages,
      isActive: true,
    }))

    return NextResponse.json({ plans, source: "fallback" })
  }
}
