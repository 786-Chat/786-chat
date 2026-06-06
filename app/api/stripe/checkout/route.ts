import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import Stripe from "stripe"

// Get Stripe instance with stored keys
async function getStripe() {
  const settings = await sql`SELECT stripe_secret_key FROM stripe_settings LIMIT 1`
  if (settings.length === 0 || !settings[0].stripe_secret_key) {
    throw new Error("Stripe not configured")
  }
  return new Stripe(settings[0].stripe_secret_key)
}

// Get current user
async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  return verifyToken(token)
}

// Plan prices in pence/cents
const PLAN_PRICES: Record<string, Record<string, number>> = {
  basic: { GBP: 200, USD: 300, EUR: 300, PKR: 100000 },
  pro: { GBP: 2000, USD: 2600, EUR: 2400, PKR: 700000 },
  business: { GBP: 4000, USD: 5200, EUR: 4800, PKR: 1400000 },
  enterprise: { GBP: 9900, USD: 12900, EUR: 11900, PKR: 3500000 }
}

const PLAN_NAMES: Record<string, string> = {
  basic: "MujeebProAI Membership",
  pro: "Pro Plan", 
  business: "Business Plan",
  enterprise: "Enterprise Plan"
}

// Credit top-up options
const TOPUP_OPTIONS: Record<string, { credits: number; prices: Record<string, number> }> = {
  small: { credits: 50, prices: { GBP: 500, USD: 650, EUR: 600, PKR: 175000 } },
  medium: { credits: 150, prices: { GBP: 1200, USD: 1560, EUR: 1440, PKR: 420000 } },
  large: { credits: 500, prices: { GBP: 3500, USD: 4550, EUR: 4200, PKR: 1225000 } }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, planId, topupId } = await request.json()
    const stripe = await getStripe()
    
    // Get currency from settings
    const settings = await sql`SELECT default_currency, vat_enabled, vat_rate FROM stripe_settings LIMIT 1`
    const currency = settings[0]?.default_currency?.toLowerCase() || "gbp"
    const vatEnabled = settings[0]?.vat_enabled || false
    const vatRate = settings[0]?.vat_rate || 20

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lineItems: any[] = []
    let metadata: Record<string, string> = {
      user_id: user.id,
      type
    }

    if (type === "subscription" && planId) {
      const planPrice = PLAN_PRICES[planId]?.[currency.toUpperCase()]
      if (!planPrice) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
      }

      let unitAmount = planPrice
      if (vatEnabled) {
        unitAmount = Math.round(planPrice * (1 + vatRate / 100))
      }

      lineItems = [{
        price_data: {
          currency,
          product_data: {
            name: PLAN_NAMES[planId],
            description: `MujeebProAI ${PLAN_NAMES[planId]} - Monthly subscription`
          },
          unit_amount: unitAmount,
          recurring: { interval: "month" }
        },
        quantity: 1
      }]
      metadata.plan_id = planId

    } else if (type === "topup" && topupId) {
      const topup = TOPUP_OPTIONS[topupId]
      if (!topup) {
        return NextResponse.json({ error: "Invalid top-up option" }, { status: 400 })
      }

      let unitAmount = topup.prices[currency.toUpperCase()]
      if (vatEnabled) {
        unitAmount = Math.round(unitAmount * (1 + vatRate / 100))
      }

      lineItems = [{
        price_data: {
          currency,
          product_data: {
            name: `${topup.credits} AI Credits`,
            description: `Top up ${topup.credits} AI message credits`
          },
          unit_amount: unitAmount
        },
        quantity: 1
      }]
      metadata.credits = topup.credits.toString()
      metadata.topup_id = topupId

    } else {
      return NextResponse.json({ error: "Invalid checkout type" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: type === "subscription" ? "subscription" : "payment",
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?canceled=true`,
      customer_email: user.email,
      metadata,
      allow_promotion_codes: true
    })

    // Record pending payment
    await sql`
      INSERT INTO payments (user_id, stripe_session_id, type, amount, currency, status, plan_id, credits_added)
      VALUES (
        ${user.id}::uuid,
        ${session.id},
        ${type},
        ${(lineItems[0].price_data?.unit_amount || 0) / 100},
        ${currency.toUpperCase()},
        'pending',
        ${planId || null},
        ${type === "topup" ? parseInt(metadata.credits || "0") : 0}
      )
    `

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    const message = error instanceof Error ? error.message : "Checkout failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
