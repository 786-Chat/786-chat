import { NextRequest, NextResponse } from "next/server"
import { stripe, getStripe } from "@/lib/stripe"
import Stripe from "stripe"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id")
    
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
    }

    // Verify user is authenticated
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status !== "paid") {
      return NextResponse.json({ 
        error: "Payment not completed" 
      }, { status: 400 })
    }

    const themeId = session.metadata?.themeId
    const userId = session.metadata?.userId
    const siteName = session.metadata?.siteName
    const subdomain = session.metadata?.subdomain
    const themeName = session.metadata?.themeName

    // Verify this belongs to the current user
    if (userId !== payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if already processed
    const existingPurchase = await sql`
      SELECT id FROM theme_purchases 
      WHERE stripe_checkout_session_id = ${sessionId} AND status = 'completed'
    `

    let siteId: string

    if (existingPurchase.length === 0) {
      // Update purchase status
      await sql`
        UPDATE theme_purchases 
        SET status = 'completed', 
            stripe_payment_intent_id = ${session.payment_intent as string}
        WHERE stripe_checkout_session_id = ${sessionId}
      `

      // Create customer site
      const [newSite] = await sql`
        INSERT INTO customer_sites (user_id, theme_id, site_name, subdomain, status, is_active)
        VALUES (${userId}, ${themeId}, ${siteName}, ${subdomain}, 'draft', true)
        RETURNING id
      `

      siteId = newSite.id

      // Create site settings
      await sql`
        INSERT INTO customer_site_settings (site_id, business_name)
        VALUES (${siteId}, ${siteName})
      `

      // Update theme sales count
      await sql`
        UPDATE themes SET sales_count = sales_count + 1 WHERE id = ${themeId}
      `
    } else {
      // Get existing site
      const [existingSite] = await sql`
        SELECT id FROM customer_sites 
        WHERE user_id = ${userId} AND theme_id = ${themeId}
        ORDER BY created_at DESC
        LIMIT 1
      `
      siteId = existingSite?.id || ""
    }

    return NextResponse.json({
      siteName,
      subdomain,
      themeName,
      siteId
    })
  } catch (error) {
    console.error("Error verifying purchase:", error)
    return NextResponse.json({ 
      error: "Failed to verify purchase" 
    }, { status: 500 })
  }
}
