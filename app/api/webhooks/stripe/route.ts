import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import Stripe from "stripe"
import { completeTopup } from "@/lib/ai-balance"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Check if this is an AI credits top-up
        if (session.metadata?.type === "ai_credits_topup" || session.metadata?.type === "credits_topup") {
          const credits = parseInt(session.metadata?.credits || "0", 10)
          const userId = session.metadata?.userId

          if (userId && credits > 0) {
            // Update transaction status
            await sql`
              UPDATE topup_transactions 
              SET status = 'completed', 
                  payment_intent_id = ${session.payment_intent as string},
                  completed_at = NOW()
              WHERE stripe_session_id = ${session.id}
            `

            // Add credits to user balance
            await sql`
              INSERT INTO user_balances (user_id, balance)
              VALUES (${userId}::uuid, ${credits})
              ON CONFLICT (user_id) 
              DO UPDATE SET 
                balance = user_balances.balance + ${credits},
                updated_at = NOW()
            `

            console.log(`[Stripe Webhook] Credits top-up completed: ${credits} credits for user ${userId}`)
          }
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`)
        
        // Update transaction status if it exists
        if (paymentIntent.metadata?.topupTransactionId) {
          await sql`
            UPDATE topup_transactions 
            SET status = 'failed' 
            WHERE id = ${paymentIntent.metadata.topupTransactionId}::uuid
          `
        }
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
