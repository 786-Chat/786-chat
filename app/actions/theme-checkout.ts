"use server"

import { stripe } from "@/lib/stripe"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export async function createThemeCheckoutSession(themeId: string) {
  try {
    // Verify user is logged in
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return { error: "Please log in to purchase themes" }
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return { error: "Invalid session. Please log in again" }
    }

    // Get theme details from database
    const themes = await sql`
      SELECT * FROM themes WHERE id = ${themeId} AND is_active = true
    `

    if (themes.length === 0) {
      return { error: "Theme not found" }
    }

    const theme = themes[0]

    // Check if user already purchased this theme
    const existingPurchase = await sql`
      SELECT * FROM theme_purchases 
      WHERE user_id = ${payload.id} AND theme_id = ${themeId} AND status = 'completed'
    `

    if (existingPurchase.length > 0) {
      return { error: "You already own this theme" }
    }

    // For free themes, create purchase directly
    if (theme.price_cents === 0) {
      await sql`
        INSERT INTO theme_purchases (user_id, theme_id, amount_paid, currency, status, purchased_at)
        VALUES (${payload.id}, ${themeId}, 0, ${theme.currency || 'GBP'}, 'completed', NOW())
        ON CONFLICT (user_id, theme_id) DO UPDATE SET status = 'completed', purchased_at = NOW()
      `

      // Update sales count
      await sql`
        UPDATE themes SET sales_count = sales_count + 1 WHERE id = ${themeId}
      `

      return { success: true, free: true }
    }

    // Create Stripe checkout session for paid themes
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"
    
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: (theme.currency || "GBP").toLowerCase(),
            product_data: {
              name: theme.name,
              description: theme.description || `${theme.name} - Website Theme`,
            },
            unit_amount: theme.price_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/themes/${theme.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/themes/${theme.slug}`,
      metadata: {
        theme_id: themeId,
        user_id: payload.id,
        theme_name: theme.name,
      },
      customer_email: payload.email,
    })

    // Create pending purchase record
    await sql`
      INSERT INTO theme_purchases (user_id, theme_id, stripe_checkout_session_id, amount_paid, currency, status)
      VALUES (${payload.id}, ${themeId}, ${session.id}, ${theme.price_cents}, ${theme.currency || 'GBP'}, 'pending')
      ON CONFLICT (user_id, theme_id) DO UPDATE SET 
        stripe_checkout_session_id = ${session.id},
        status = 'pending'
    `

    return { sessionId: session.id, url: session.url }
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return { error: "Failed to create checkout session" }
  }
}

export async function verifyThemePurchase(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== "paid") {
      return { error: "Payment not completed" }
    }

    const themeId = session.metadata?.theme_id
    const userId = session.metadata?.user_id

    if (!themeId || !userId) {
      return { error: "Invalid session metadata" }
    }

    // Update purchase status
    await sql`
      UPDATE theme_purchases 
      SET status = 'completed', 
          stripe_payment_intent_id = ${session.payment_intent as string},
          purchased_at = NOW()
      WHERE stripe_checkout_session_id = ${sessionId}
    `

    // Update sales count
    await sql`
      UPDATE themes SET sales_count = sales_count + 1 WHERE id = ${themeId}
    `

    return { success: true, themeId }
  } catch (error) {
    console.error("Error verifying purchase:", error)
    return { error: "Failed to verify purchase" }
  }
}
