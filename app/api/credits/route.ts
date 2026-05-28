import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"
import { BILLING_PLANS, type PlanId } from "@/lib/billing"
import Stripe from "stripe"

const sql = neon(process.env.DATABASE_URL!)

// Get Stripe instance with key from database settings
async function getStripe() {
  const settings = await sql`SELECT stripe_secret_key FROM admin_settings LIMIT 1`
  if (!settings[0]?.stripe_secret_key) {
    throw new Error("Stripe not configured")
  }
  return new Stripe(settings[0].stripe_secret_key)
}

// Credit packages available for purchase
const CREDIT_PACKAGES = {
  small: { credits: 10, discount: 0 },
  medium: { credits: 50, discount: 5 }, // 5% discount
  large: { credits: 100, discount: 10 }, // 10% discount
  xlarge: { credits: 500, discount: 15 }, // 15% discount
} as const

type PackageId = keyof typeof CREDIT_PACKAGES

// GET - Get user's credit balance and available packages
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's subscription and credit info
    const subscription = await sql`
      SELECT 
        plan,
        messages_used,
        messages_limit,
        extra_credits,
        daily_messages_used,
        status
      FROM subscriptions
      WHERE user_id = ${session.id}
    `

    const sub = subscription[0]
    const plan = (sub?.plan || "starter") as PlanId
    const planConfig = BILLING_PLANS[plan]

    // Calculate credit cost based on plan
    const baseCostGbp = planConfig.extraMessageCost.GBP

    // Build available packages
    const packages = Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => {
      const subtotal = pkg.credits * baseCostGbp
      const discount = subtotal * (pkg.discount / 100)
      const total = subtotal - discount

      return {
        id,
        credits: pkg.credits,
        discountPercent: pkg.discount,
        subtotalGbp: subtotal,
        discountGbp: discount,
        totalGbp: total,
        pricePerCredit: total / pkg.credits,
      }
    })

    return NextResponse.json({
      balance: {
        plan,
        monthlyIncluded: planConfig.messagesIncluded,
        monthlyUsed: sub?.messages_used || 0,
        monthlyRemaining: Math.max(0, (sub?.messages_limit || planConfig.messagesIncluded) - (sub?.messages_used || 0)),
        extraCredits: sub?.extra_credits || 0,
        dailyUsed: sub?.daily_messages_used || 0,
      },
      pricing: {
        baseCostPerCredit: baseCostGbp,
        currency: "GBP",
        currencySymbol: "£",
      },
      packages,
      allowExtraCredits: planConfig.allowExtraMessages,
    })
  } catch (error) {
    console.error("[Credits API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Purchase credits
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { packageId, customCredits } = body as { packageId?: PackageId; customCredits?: number }

    // Get user's subscription
    const subscription = await sql`
      SELECT plan, stripe_customer_id
      FROM subscriptions
      WHERE user_id = ${session.id}
    `

    const sub = subscription[0]
    const plan = (sub?.plan || "starter") as PlanId
    const planConfig = BILLING_PLANS[plan]

    if (!planConfig.allowExtraMessages) {
      return NextResponse.json(
        { error: "Your plan does not allow extra credits. Please upgrade." },
        { status: 400 }
      )
    }

    // Calculate credits and price
    let credits: number
    let totalGbp: number
    let discountPercent = 0

    if (packageId && CREDIT_PACKAGES[packageId]) {
      const pkg = CREDIT_PACKAGES[packageId]
      credits = pkg.credits
      discountPercent = pkg.discount
      const subtotal = credits * planConfig.extraMessageCost.GBP
      totalGbp = subtotal - (subtotal * (discountPercent / 100))
    } else if (customCredits && customCredits >= 1 && customCredits <= 10000) {
      credits = customCredits
      totalGbp = credits * planConfig.extraMessageCost.GBP
    } else {
      return NextResponse.json({ error: "Invalid package or credit amount" }, { status: 400 })
    }

    // Minimum purchase amount
    if (totalGbp < 1) {
      return NextResponse.json({ error: "Minimum purchase is £1" }, { status: 400 })
    }

    // Get or create Stripe customer
    let stripeCustomerId = sub?.stripe_customer_id
    const stripe = await getStripe()

    if (!stripeCustomerId) {
      const user = await sql`SELECT email, name FROM users WHERE id = ${session.id}`
      
      const customer = await stripe.customers.create({
        email: user[0].email,
        name: user[0].name || undefined,
        metadata: { userId: session.id },
      })
      stripeCustomerId = customer.id

      await sql`
        UPDATE subscriptions
        SET stripe_customer_id = ${stripeCustomerId}
        WHERE user_id = ${session.id}
      `
    }

    // Create Stripe checkout session for one-time payment
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${credits} AI Credits`,
              description: `Extra AI message credits for MujeebProAI${discountPercent > 0 ? ` (${discountPercent}% discount)` : ""}`,
            },
            unit_amount: Math.round(totalGbp * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?credits=success&amount=${credits}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?credits=cancelled`,
      metadata: {
        userId: session.id,
        credits: credits.toString(),
        type: "credit_purchase",
      },
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      credits,
      totalGbp,
      discountPercent,
    })
  } catch (error) {
    console.error("[Credits API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
