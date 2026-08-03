import { NextResponse } from "next/server"
import type Stripe from "stripe"

import {
  BUILDER_CREDIT_PACKAGES,
  BUILDER_PLANS,
  getBuilderSubscription,
  trustedBillingOrigin,
  type BuilderCreditPackageId,
  type BuilderPlanId,
} from "@/lib/786-chat/billing"
import { consumeSecurityRateLimit, rateLimitResponse } from "@/lib/786-chat/security"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

function subscriptionLineItem(planId: Exclude<BuilderPlanId, "free">): Stripe.Checkout.SessionCreateParams.LineItem {
  const configuredPrice = process.env[`STRIPE_PRICE_${planId.toUpperCase()}_GBP`]?.trim()
  if (configuredPrice) return { price: configuredPrice, quantity: 1 }
  const plan = BUILDER_PLANS[planId]
  return {
    price_data: {
      currency: "gbp",
      product_data: {
        name: `786.Chat ${plan.name}`,
        description: plan.features.join(" · "),
      },
      unit_amount: plan.monthlyPriceGbp * 100,
      recurring: { interval: "month" },
    },
    quantity: 1,
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
    return NextResponse.json({
      error: "Billing activation is being configured. No payment was created.",
      code: "BILLING_WEBHOOK_NOT_CONFIGURED",
    }, { status: 503 })
  }

  const limit = await consumeSecurityRateLimit({
    namespace: "billing-checkout",
    identifier: session.id,
    limit: 10,
    windowSeconds: 15 * 60,
  })
  if (!limit.allowed) {
    const response = rateLimitResponse(limit)
    return NextResponse.json(response.body, { status: response.status, headers: response.headers })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const type = String(body.type || "")
  const origin = trustedBillingOrigin(request)
  const subscription = await getBuilderSubscription(session.id)
  const stripe = getStripe()
  const customerId = typeof subscription.stripe_customer_id === "string"
    ? subscription.stripe_customer_id
    : undefined

  let mode: Stripe.Checkout.SessionCreateParams.Mode
  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
  let metadata: Record<string, string>
  let planId: BuilderPlanId | null = null
  let credits = 0
  let amountGbp = 0

  if (type === "subscription") {
    const requestedPlan = String(body.planId || "") as BuilderPlanId
    if (requestedPlan !== "pro" && requestedPlan !== "business") {
      return NextResponse.json({ error: "Choose the Pro or Business plan." }, { status: 400 })
    }
    if (subscription.plan === requestedPlan && subscription.status === "active") {
      return NextResponse.json({ error: "This plan is already active. Use Manage billing to make changes." }, { status: 409 })
    }
    planId = requestedPlan
    amountGbp = BUILDER_PLANS[requestedPlan].monthlyPriceGbp
    mode = "subscription"
    lineItems = [subscriptionLineItem(requestedPlan)]
    metadata = {
      billing_version: "2",
      type: "builder_subscription",
      user_id: session.id,
      owner_email: session.email.toLowerCase().trim(),
      plan_id: requestedPlan,
    }
  } else if (type === "credits" || type === "topup") {
    const packageId = String(body.packageId || body.topupId || "") as BuilderCreditPackageId
    const creditPackage = BUILDER_CREDIT_PACKAGES[packageId]
    if (!creditPackage) {
      return NextResponse.json({ error: "Choose a valid credit package." }, { status: 400 })
    }
    credits = creditPackage.credits
    amountGbp = creditPackage.priceGbp
    mode = "payment"
    lineItems = [{
      price_data: {
        currency: "gbp",
        product_data: {
          name: `${credits} 786.Chat AI credits`,
          description: "Extra builder generations that do not expire while the account remains active.",
        },
        unit_amount: amountGbp * 100,
      },
      quantity: 1,
    }]
    metadata = {
      billing_version: "2",
      type: "builder_credits",
      user_id: session.id,
      owner_email: session.email.toLowerCase().trim(),
      credits: String(credits),
      package_id: packageId,
    }
  } else {
    return NextResponse.json({ error: "Choose a subscription or credit purchase." }, { status: 400 })
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode,
      line_items: lineItems,
      success_url: `${origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing?canceled=true`,
      client_reference_id: session.id,
      customer: customerId,
      customer_email: customerId ? undefined : session.email,
      allow_promotion_codes: mode === "subscription",
      metadata,
      subscription_data: mode === "subscription" ? { metadata } : undefined,
    })

    await sql`
      INSERT INTO payments (
        user_id, stripe_session_id, type, amount, currency, status,
        plan_id, credits_added, updated_at
      ) VALUES (
        ${session.id}::uuid, ${checkout.id}, ${type}, ${amountGbp}, 'GBP', 'pending',
        ${planId}, ${credits}, NOW()
      )
      ON CONFLICT (stripe_session_id) WHERE stripe_session_id IS NOT NULL DO NOTHING
    `
    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    console.error("[786.Chat billing] Checkout failed", error)
    return NextResponse.json({
      error: process.env.STRIPE_SECRET_KEY
        ? "Checkout is temporarily unavailable. Please try again."
        : "Billing is not configured yet.",
    }, { status: 503 })
  }
}
