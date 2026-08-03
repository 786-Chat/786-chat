import { NextResponse } from "next/server"

import { getBuilderSubscription, trustedBillingOrigin } from "@/lib/786-chat/billing"
import { consumeSecurityRateLimit, rateLimitResponse } from "@/lib/786-chat/security"
import { getSession } from "@/lib/auth"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const limit = await consumeSecurityRateLimit({
    namespace: "billing-portal",
    identifier: session.id,
    limit: 10,
    windowSeconds: 15 * 60,
  })
  if (!limit.allowed) {
    const response = rateLimitResponse(limit)
    return NextResponse.json(response.body, { status: response.status, headers: response.headers })
  }
  const subscription = await getBuilderSubscription(session.id)
  const customer = typeof subscription.stripe_customer_id === "string"
    ? subscription.stripe_customer_id
    : ""
  if (!customer) {
    return NextResponse.json({ error: "No Stripe billing account exists yet." }, { status: 409 })
  }
  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer,
      return_url: `${trustedBillingOrigin(request)}/dashboard/billing`,
    })
    return NextResponse.json({ url: portal.url })
  } catch (error) {
    console.error("[786.Chat billing] Portal failed", error)
    return NextResponse.json({ error: "The billing portal is temporarily unavailable." }, { status: 503 })
  }
}
