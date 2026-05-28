import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const payload = await getSession()
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId, siteId } = await request.json()

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    // Verify site belongs to user
    const [site] = await sql`
      SELECT cs.*, css.email, css.business_name
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON css.site_id = cs.id
      WHERE cs.id = ${siteId} AND cs.user_id = ${payload.id}
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Update site status to active
    await sql`
      UPDATE customer_sites 
      SET 
        status = 'active',
        stripe_subscription_id = ${session.subscription as string},
        activated_at = NOW(),
        updated_at = NOW()
      WHERE id = ${siteId}
    `

    // Create theme purchase record
    await sql`
      INSERT INTO theme_purchases (
        user_id,
        theme_id,
        site_id,
        stripe_session_id,
        stripe_subscription_id,
        amount_paid,
        currency,
        status,
        created_at
      ) VALUES (
        ${payload.id},
        ${site.theme_id},
        ${siteId},
        ${sessionId},
        ${session.subscription as string},
        ${session.amount_total || 0},
        'gbp',
        'active',
        NOW()
      )
      ON CONFLICT (site_id) DO UPDATE SET
        stripe_subscription_id = ${session.subscription as string},
        status = 'active',
        updated_at = NOW()
    `

    // Generate website URL
    const websiteUrl = site.subdomain 
      ? `https://${site.subdomain}.mujeebproai.com`
      : site.custom_domain 
        ? `https://${site.custom_domain}`
        : `https://www.mujeebproai.com/sites/${siteId}`

    const adminUrl = `https://www.mujeebproai.com/dashboard/sites/${siteId}`

    return NextResponse.json({
      success: true,
      siteName: site.site_name || site.business_name,
      subdomain: site.subdomain,
      websiteUrl,
      adminUrl,
      email: site.email,
    })
  } catch (error) {
    console.error("Verify setup error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    )
  }
}
