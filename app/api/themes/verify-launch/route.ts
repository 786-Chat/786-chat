import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, siteId } = await request.json()

    if (!sessionId || !siteId) {
      return NextResponse.json(
        { error: "Missing session or site ID" },
        { status: 400 }
      )
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      )
    }

    // Check if site belongs to this session
    if (session.metadata?.siteId !== siteId) {
      return NextResponse.json(
        { error: "Site ID mismatch" },
        { status: 400 }
      )
    }

    // Activate the site
    const [site] = await sql`
      UPDATE customer_sites SET
        status = 'active',
        is_active = true,
        is_published = true,
        activated_at = NOW(),
        stripe_subscription_id = ${session.subscription as string || null},
        updated_at = NOW()
      WHERE id = ${siteId}
      RETURNING *
    `

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      )
    }

    // Record the purchase
    await sql`
      INSERT INTO theme_purchases (
        user_id,
        theme_id,
        amount_paid,
        currency,
        status,
        stripe_checkout_session_id,
        purchased_at
      ) VALUES (
        ${site.user_id},
        ${site.theme_id},
        ${session.amount_total || 0},
        ${session.currency?.toUpperCase() || 'GBP'},
        'completed',
        ${sessionId},
        NOW()
      )
    `

    // Log the revenue
    await sql`
      INSERT INTO revenue_logs (
        user_id,
        type,
        amount,
        currency,
        stripe_payment_id
      ) VALUES (
        ${site.user_id},
        'theme_purchase',
        ${(session.amount_total || 0) / 100},
        ${session.currency?.toUpperCase() || 'GBP'},
        ${session.payment_intent as string || sessionId}
      )
    `

    return NextResponse.json({
      success: true,
      site: {
        id: site.id,
        site_name: site.site_name,
        subdomain: site.subdomain,
        custom_domain: site.custom_domain,
        status: site.status,
        theme_name: site.theme_name,
        settings: site.settings,
      },
    })
  } catch (error) {
    console.error("Verify launch error:", error)
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    )
  }
}
