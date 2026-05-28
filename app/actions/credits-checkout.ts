"use server"

import { stripe } from "@/lib/stripe"
import { CREDIT_PACKAGES, calculateOrderTotal } from "@/lib/credit-packages"
import { getSession } from "@/lib/auth"
import { getSql } from "@/lib/db"


export async function startCreditsCheckout(packageId: string) {
  const session = await getSession()
  if (!session) {
    throw new Error("Not authenticated")
  }

  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId)
  if (!creditPackage) {
    throw new Error(`Package with id "${packageId}" not found`)
  }

  const totals = calculateOrderTotal(creditPackage.priceInCents)

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    customer_email: session.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${creditPackage.credits} MujeebProAI Credits`,
            description: `Add ${creditPackage.credits} credits to your account`,
          },
          unit_amount: creditPackage.priceInCents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Processing Fee",
          },
          unit_amount: totals.processingFee,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      userId: session.id,
      packageId: packageId,
      credits: creditPackage.credits.toString(),
      type: "credits_topup",
    },
  })

  // Record pending transaction
  await getSql()`
    INSERT INTO topup_transactions (user_id, amount, credits_added, stripe_session_id, status)
    VALUES (${session.id}::uuid, ${totals.total / 100}, ${creditPackage.credits}, ${checkoutSession.id}, 'pending')
  `

  return checkoutSession.client_secret
}

export async function getCheckoutSessionStatus(sessionId: string) {
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
  return {
    status: checkoutSession.status,
    paymentStatus: checkoutSession.payment_status,
    customerEmail: checkoutSession.customer_details?.email,
  }
}
