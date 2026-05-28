import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getStripe } from "@/lib/stripe"


export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Please login to continue" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { themeId, siteName, subdomain } = await request.json()

    if (!themeId || !siteName || !subdomain) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get theme details
    const themes = await sql`
      SELECT id, name, slug, price_cents, currency 
      FROM themes 
      WHERE id = ${themeId} AND is_active = true
    `

    if (themes.length === 0) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    const theme = themes[0]

    // Check if subdomain is available
    const existingSites = await sql`
      SELECT id FROM customer_sites WHERE subdomain = ${subdomain.toLowerCase()}
    `

    if (existingSites.length > 0) {
      return NextResponse.json({ error: "Subdomain is already taken" }, { status: 400 })
    }

    // Check if user already purchased this theme
    const existingPurchase = await sql`
      SELECT id FROM theme_purchases 
      WHERE user_id = ${payload.id} AND theme_id = ${themeId} AND status = 'completed'
    `

    if (existingPurchase.length > 0) {
      return NextResponse.json({ error: "You already own this theme" }, { status: 400 })
    }

    // Get user email
    const users = await sql`SELECT email, name FROM users WHERE id = ${payload.id}`
    const userEmail = users[0]?.email || ""
    const userName = users[0]?.name || ""

    // Create Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: (theme.currency || "GBP").toLowerCase(),
            product_data: {
              name: `${theme.name} Theme`,
              description: `Website theme for ${siteName}`,
            },
            unit_amount: Number(theme.price_cents),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: payload.id,
        themeId: theme.id,
        themeName: theme.name,
        siteName,
        subdomain: subdomain.toLowerCase(),
        userName,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"}/themes/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"}/themes`,
    })

    // Create pending purchase record
    await sql`
      INSERT INTO theme_purchases (user_id, theme_id, stripe_checkout_session_id, amount_paid, currency, status)
      VALUES (${payload.id}, ${themeId}, ${session.id}, ${theme.price_cents}, ${theme.currency || "GBP"}, 'pending')
      ON CONFLICT (user_id, theme_id) DO UPDATE SET
        stripe_checkout_session_id = ${session.id},
        status = 'pending'
    `

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Theme checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
