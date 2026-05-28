import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getSession } from "@/lib/auth"
import { recordTopup } from "@/lib/ai-balance"

  apiVersion: "2025-04-30.basil",
})

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await request.json()

    // Validate amount
    const validAmounts = [5, 10, 20, 50, 100]
    if (!validAmounts.includes(amount)) {
      return NextResponse.json({ error: "Invalid top-up amount" }, { status: 400 })
    }

    // Create Stripe Checkout Session
    const checkoutSession = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: session.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `MujeebProAI Credits - $${amount}`,
              description: `Add $${amount} credits to your AI balance`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.id,
        amount: String(amount),
        type: "ai_credits_topup",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://mujeebproai.com"}/dashboard?topup=success&amount=${amount}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://mujeebproai.com"}/dashboard?topup=cancelled`,
    })

    // Record pending transaction
    await recordTopup(session.id, amount, amount, checkoutSession.id, "pending")

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id 
    })
  } catch (error) {
    console.error("[Topup API] Error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
