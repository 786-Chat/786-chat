import { NextResponse } from "next/server"
import type Stripe from "stripe"

import { BUILDER_PLANS, normalizeBuilderPlan, type BuilderPlanId } from "@/lib/786-chat/billing"
import { sql } from "@/lib/db"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

function safeMessage(error: unknown) {
  return (error instanceof Error ? error.message : String(error || "Webhook processing failed"))
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 500)
}

function stripeStatus(status: string) {
  if (status === "active" || status === "trialing") return "active"
  if (status === "past_due" || status === "unpaid" || status === "paused") return status
  return "canceled"
}

function unixDate(value: unknown) {
  const seconds = Number(value || 0)
  return Number.isFinite(seconds) && seconds > 0
    ? new Date(seconds * 1000).toISOString()
    : null
}

async function beginEvent(event: Stripe.Event) {
  const rows = (await sql`
    INSERT INTO builder_billing_events (event_id, event_type, status, attempt_count, updated_at)
    VALUES (${event.id}, ${event.type}, 'processing', 1, NOW())
    ON CONFLICT (event_id) DO UPDATE SET
      status = 'processing',
      attempt_count = builder_billing_events.attempt_count + 1,
      error_message = NULL,
      updated_at = NOW()
    WHERE builder_billing_events.status = 'failed'
    RETURNING event_id
  `) as unknown as Array<{ event_id: string }>
  return Boolean(rows[0])
}

async function completeEvent(eventId: string) {
  await sql`
    UPDATE builder_billing_events
    SET status = 'completed', completed_at = NOW(), updated_at = NOW(), error_message = NULL
    WHERE event_id = ${eventId}
  `
}

async function failEvent(eventId: string, error: unknown) {
  await sql`
    UPDATE builder_billing_events
    SET status = 'failed', error_message = ${safeMessage(error)}, updated_at = NOW()
    WHERE event_id = ${eventId}
  `
}

async function activateCheckout(session: Stripe.Checkout.Session, eventId: string) {
  const metadata = session.metadata || {}
  if (metadata.billing_version !== "2") return
  const userId = metadata.user_id
  if (!userId || session.client_reference_id !== userId) {
    throw new Error("Checkout session customer reference does not match billing metadata")
  }
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
  const paymentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id

  await sql`
    UPDATE payments
    SET status = 'completed', stripe_payment_id = ${paymentId || (typeof session.subscription === "string" ? session.subscription : null)},
        stripe_event_id = ${eventId}, updated_at = NOW()
    WHERE stripe_session_id = ${session.id} AND user_id = ${userId}::uuid
  `

  if (metadata.type === "builder_credits") {
    if (session.payment_status !== "paid") throw new Error("Credit checkout is not paid")
    const credits = Number(metadata.credits || 0)
    if (!Number.isInteger(credits) || credits < 1 || credits > 10_000) {
      throw new Error("Invalid credit quantity")
    }
    await sql`
      UPDATE subscriptions
      SET extra_credits = COALESCE(extra_credits, 0) + ${credits},
          stripe_customer_id = COALESCE(${customerId || null}, stripe_customer_id),
          updated_at = NOW()
      WHERE user_id = ${userId}::uuid
    `
    await sql`
      INSERT INTO revenue_logs (user_id, amount, currency, type, credits_added, stripe_payment_id)
      VALUES (${userId}::uuid, ${Number(session.amount_total || 0) / 100},
              ${String(session.currency || "gbp").toUpperCase()}, 'credit_purchase', ${credits}, ${paymentId || null})
    `
    return
  }

  if (metadata.type !== "builder_subscription") return
  const planId = normalizeBuilderPlan(metadata.plan_id)
  if (planId === "free") throw new Error("Invalid paid plan")
  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id
  if (!subscriptionId) throw new Error("Stripe subscription ID is missing")
  const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId)
  const raw = stripeSubscription as unknown as Record<string, unknown>
  const items = stripeSubscription.items?.data || []
  const priceId = items[0]?.price?.id || null
  const plan = BUILDER_PLANS[planId]
  await sql`
    INSERT INTO subscriptions (
      user_id, plan, messages_used, messages_limit, extra_credits,
      stripe_customer_id, stripe_subscription_id, stripe_price_id, status,
      current_period_start, current_period_end, cancel_at_period_end, updated_at
    ) VALUES (
      ${userId}::uuid, ${planId}, 0, ${plan.messagesIncluded}, 0,
      ${customerId || null}, ${subscriptionId}, ${priceId}, ${stripeStatus(stripeSubscription.status)},
      ${unixDate(raw.current_period_start)}, ${unixDate(raw.current_period_end)},
      ${Boolean(stripeSubscription.cancel_at_period_end)}, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan = EXCLUDED.plan,
      messages_used = 0,
      messages_limit = EXCLUDED.messages_limit,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      stripe_price_id = EXCLUDED.stripe_price_id,
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      updated_at = NOW()
  `
  await sql`UPDATE users SET plan = ${planId} WHERE id = ${userId}::uuid`
  await sql`
    INSERT INTO revenue_logs (user_id, amount, currency, type, plan_id, stripe_payment_id)
    VALUES (${userId}::uuid, ${Number(session.amount_total || plan.monthlyPriceGbp * 100) / 100},
            ${String(session.currency || "gbp").toUpperCase()}, 'subscription', ${planId}, ${subscriptionId})
  `
}

async function updateSubscription(subscription: Stripe.Subscription) {
  const raw = subscription as unknown as Record<string, unknown>
  const metadata = subscription.metadata || {}
  const planId = normalizeBuilderPlan(metadata.plan_id)
  const status = stripeStatus(subscription.status)
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id
  const rows = (await sql`
    UPDATE subscriptions
    SET status = ${status},
        plan = CASE WHEN ${status} = 'canceled' THEN 'free' ELSE plan END,
        messages_limit = CASE WHEN ${status} = 'canceled' THEN ${BUILDER_PLANS.free.messagesIncluded} ELSE messages_limit END,
        stripe_customer_id = ${customerId},
        stripe_price_id = ${subscription.items?.data[0]?.price?.id || null},
        current_period_start = ${unixDate(raw.current_period_start)},
        current_period_end = ${unixDate(raw.current_period_end)},
        cancel_at_period_end = ${Boolean(subscription.cancel_at_period_end)},
        stripe_subscription_id = CASE WHEN ${status} = 'canceled' THEN NULL ELSE ${subscription.id} END,
        updated_at = NOW()
    WHERE stripe_subscription_id = ${subscription.id}
       OR (${metadata.user_id || null} IS NOT NULL AND user_id = ${metadata.user_id || null}::uuid)
    RETURNING user_id
  `) as unknown as Array<{ user_id: string }>
  if (rows[0]) {
    await sql`
      UPDATE users SET plan = ${status === "canceled" ? "free" : planId}
      WHERE id = ${rows[0].user_id}::uuid
    `
  }
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const raw = invoice as unknown as Record<string, unknown>
  if (typeof raw.subscription === "string") return raw.subscription
  const parent = raw.parent && typeof raw.parent === "object" ? raw.parent as Record<string, unknown> : {}
  const detail = parent.subscription_details && typeof parent.subscription_details === "object"
    ? parent.subscription_details as Record<string, unknown>
    : {}
  return typeof detail.subscription === "string" ? detail.subscription : null
}

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await activateCheckout(event.data.object as Stripe.Checkout.Session, event.id)
      break
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await updateSubscription(event.data.object as Stripe.Subscription)
      break
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoiceSubscriptionId(invoice)
      if (subscriptionId) {
        await sql`
          UPDATE subscriptions
          SET messages_used = 0, status = 'active', billing_period_start = NOW(), updated_at = NOW()
          WHERE stripe_subscription_id = ${subscriptionId}
        `
      }
      break
    }
    case "invoice.payment_failed": {
      const subscriptionId = invoiceSubscriptionId(event.data.object as Stripe.Invoice)
      if (subscriptionId) {
        await sql`
          UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
          WHERE stripe_subscription_id = ${subscriptionId}
        `
      }
      break
    }
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret) {
    console.error("[786.Chat billing] STRIPE_WEBHOOK_SECRET is not configured")
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 })
  }
  const signature = request.headers.get("stripe-signature")
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret)
  } catch (error) {
    console.error("[786.Chat billing] Webhook signature rejected", safeMessage(error))
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 })
  }

  if (!(await beginEvent(event))) return NextResponse.json({ received: true, duplicate: true })
  try {
    await processEvent(event)
    await completeEvent(event.id)
    return NextResponse.json({ received: true })
  } catch (error) {
    await failEvent(event.id, error)
    console.error("[786.Chat billing] Webhook processing failed", safeMessage(error))
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }
}
