import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import Stripe from "stripe"

// Get Stripe instance with settings from database
async function getStripeWithSecret() {
  const settings = await sql`SELECT stripe_secret_key, stripe_webhook_secret FROM stripe_settings LIMIT 1`
  if (settings.length === 0 || !settings[0].stripe_secret_key) {
    throw new Error("Stripe not configured")
  }
  return {
    stripe: new Stripe(settings[0].stripe_secret_key),
    webhookSecret: settings[0].stripe_webhook_secret
  }
}

// Plan message limits
const PLAN_LIMITS: Record<string, number> = {
  starter: 5,
  basic: 100,
  pro: 300,
  business: 2000,
  enterprise: 3000
}

// Plan prices in GBP for revenue tracking
const PLAN_PRICES: Record<string, number> = {
  starter: 0,
  basic: 10,
  pro: 20,
  business: 40,
  enterprise: 99
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    const { stripe, webhookSecret } = await getStripeWithSecret()
    
    let event: Stripe.Event

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } else {
        // If no webhook secret configured, parse directly (not recommended for production)
        event = JSON.parse(body) as Stripe.Event
      }
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log(`Processing Stripe event: ${event.type}`)

    switch (event.type) {
      // ============================================
      // CHECKOUT COMPLETED
      // ============================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}
        const userId = metadata.user_id
        const type = metadata.type

        if (!userId) {
          console.error("No user_id in session metadata")
          break
        }

        // Get or create Stripe customer ID for user
        const stripeCustomerId = session.customer as string

        // Update user with Stripe customer ID
        if (stripeCustomerId) {
          await sql`
            UPDATE subscriptions 
            SET stripe_customer_id = ${stripeCustomerId}
            WHERE user_id = ${userId}::uuid
          `
        }

        // Update payment record
        await sql`
          UPDATE payments 
          SET status = 'completed', 
              stripe_payment_id = ${session.payment_intent as string || session.subscription as string || null}
          WHERE stripe_session_id = ${session.id}
        `

        if (type === "subscription" && metadata.plan_id) {
          // Update user plan and reset message count
          const newLimit = PLAN_LIMITS[metadata.plan_id] || 100
          const planPrice = PLAN_PRICES[metadata.plan_id] || 0

          await sql`
            UPDATE subscriptions 
            SET plan = ${metadata.plan_id}, 
                messages_used = 0, 
                messages_limit = ${newLimit},
                stripe_subscription_id = ${session.subscription as string || null},
                stripe_customer_id = ${stripeCustomerId},
                status = 'active',
                updated_at = NOW()
            WHERE user_id = ${userId}::uuid
          `

          await sql`
            UPDATE users SET plan = ${metadata.plan_id} WHERE id = ${userId}::uuid
          `

          // Record revenue for admin dashboard
          await sql`
            INSERT INTO revenue_logs (user_id, amount, currency, type, plan_id, stripe_payment_id)
            VALUES (${userId}::uuid, ${planPrice}, 'GBP', 'subscription', ${metadata.plan_id}, ${session.payment_intent as string || null})
          `

          console.log(`Updated user ${userId} to plan ${metadata.plan_id}`)

        } else if (type === "topup" && metadata.credits) {
          // Add credits to user's message limit
          const credits = parseInt(metadata.credits)
          const amount = parseFloat(metadata.amount || "0")

          await sql`
            UPDATE subscriptions 
            SET messages_limit = messages_limit + ${credits},
                updated_at = NOW()
            WHERE user_id = ${userId}::uuid
          `

          // Record topup revenue
          await sql`
            INSERT INTO revenue_logs (user_id, amount, currency, type, credits_added, stripe_payment_id)
            VALUES (${userId}::uuid, ${amount}, 'GBP', 'topup', ${credits}, ${session.payment_intent as string || null})
          `

          console.log(`Added ${credits} message credits to user ${userId}`)

        } else if (type === "credit_purchase" && metadata.credits) {
          // Add EXTRA credits (different from monthly limit)
          const credits = parseInt(metadata.credits)
          const amount = (session.amount_total || 0) / 100 // Convert from cents

          await sql`
            UPDATE subscriptions 
            SET extra_credits = COALESCE(extra_credits, 0) + ${credits},
                updated_at = NOW()
            WHERE user_id = ${userId}::uuid
          `

          // Record credit purchase revenue
          await sql`
            INSERT INTO revenue_logs (user_id, amount, currency, type, credits_added, stripe_payment_id)
            VALUES (${userId}::uuid, ${amount}, 'GBP', 'credit_purchase', ${credits}, ${session.payment_intent as string || null})
          `

          // Log usage for tracking
          await sql`
            INSERT INTO usage_logs (user_id, action, metadata)
            VALUES (${userId}::uuid, 'credit_purchase', ${JSON.stringify({ credits, amount })})
          `

          console.log(`Added ${credits} extra credits to user ${userId} for £${amount}`)
        }
        break
      }

      // ============================================
      // SUBSCRIPTION CREATED
      // ============================================
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID and activate subscription
        await sql`
          UPDATE subscriptions 
          SET stripe_subscription_id = ${subscription.id},
              status = 'active',
              updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `

        console.log(`Subscription ${subscription.id} created for customer ${customerId}`)
        break
      }

      // ============================================
      // SUBSCRIPTION UPDATED
      // ============================================
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const status = subscription.status

        // Map Stripe status to our status
        let ourStatus = 'active'
        if (status === 'past_due') ourStatus = 'past_due'
        else if (status === 'canceled') ourStatus = 'canceled'
        else if (status === 'unpaid') ourStatus = 'unpaid'
        else if (status === 'paused') ourStatus = 'paused'

        await sql`
          UPDATE subscriptions 
          SET status = ${ourStatus},
              updated_at = NOW()
          WHERE stripe_subscription_id = ${subscription.id}
        `

        console.log(`Subscription ${subscription.id} updated to status ${ourStatus}`)
        break
      }

      // ============================================
      // SUBSCRIPTION DELETED (CANCELED)
      // ============================================
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        // Downgrade user to Starter plan
        await sql`
          UPDATE subscriptions 
          SET plan = 'starter',
              messages_limit = 5,
              messages_used = 0,
              status = 'canceled',
              stripe_subscription_id = NULL,
              updated_at = NOW()
          WHERE stripe_subscription_id = ${subscription.id}
          RETURNING user_id
        `

        // Also update the user's plan
        const result = await sql`
          SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ${subscription.id}
        `
        if (result.length > 0) {
          await sql`UPDATE users SET plan = 'starter' WHERE id = ${result[0].user_id}`
        }

        console.log(`Subscription ${subscription.id} canceled, user downgraded to Starter`)
        break
      }

      // ============================================
      // INVOICE PAYMENT SUCCEEDED (Renewal)
      // ============================================
      case "invoice.payment_succeeded": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string
        const amountPaid = (invoice.amount_paid || 0) / 100 // Convert from cents

        if (subscriptionId && invoice.billing_reason === "subscription_cycle") {
          // This is a renewal payment - reset message count
          const result = await sql`
            UPDATE subscriptions 
            SET messages_used = 0, 
                status = 'active',
                updated_at = NOW()
            WHERE stripe_subscription_id = ${subscriptionId}
            RETURNING user_id, plan
          `

          if (result.length > 0) {
            const { user_id, plan } = result[0]
            
            // Record renewal revenue
            await sql`
              INSERT INTO revenue_logs (user_id, amount, currency, type, plan_id, stripe_payment_id)
              VALUES (${user_id}, ${amountPaid}, 'GBP', 'renewal', ${plan}, ${invoice.payment_intent as string || null})
            `

            console.log(`Subscription ${subscriptionId} renewed, messages reset`)
          }
        }
        break
      }

      // ============================================
      // INVOICE PAYMENT FAILED
      // ============================================
      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Mark subscription as past_due - this will pause AI chat access
          await sql`
            UPDATE subscriptions 
            SET status = 'past_due',
                updated_at = NOW()
            WHERE stripe_subscription_id = ${subscriptionId}
          `

          console.log(`Subscription ${subscriptionId} payment failed, marked as past_due`)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
