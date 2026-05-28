import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { sql } from "@/lib/db"


export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    
    const themeId = session.metadata?.theme_id
    const userId = session.metadata?.user_id

    if (themeId && userId) {
      try {
        // Update purchase status
        await sql`
          UPDATE theme_purchases 
          SET status = 'completed',
              stripe_payment_intent_id = ${session.payment_intent as string}
          WHERE stripe_checkout_session_id = ${session.id}
        `

        // Get theme details
        const [theme] = await sql`SELECT name, slug FROM themes WHERE id = ${themeId}`
        
        // Create customer site if not exists
        const existingSite = await sql`
          SELECT id FROM customer_sites 
          WHERE user_id = ${userId} AND theme_id = ${themeId}
        `
        
        if (existingSite.length === 0) {
          // Generate unique subdomain
          const [user] = await sql`SELECT name, email FROM users WHERE id = ${userId}`
          const baseName = (user?.name || user?.email?.split("@")[0] || "site")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
          
          let subdomain = baseName
          let counter = 1
          
          // Check for uniqueness
          while (true) {
            const existing = await sql`
              SELECT id FROM customer_sites WHERE subdomain = ${subdomain}
            `
            if (existing.length === 0) break
            subdomain = `${baseName}${counter}`
            counter++
          }

          // Create site
          await sql`
            INSERT INTO customer_sites (
              user_id, 
              theme_id, 
              site_name, 
              subdomain,
              site_config,
              site_content
            ) VALUES (
              ${userId},
              ${themeId},
              ${theme?.name || "My Site"},
              ${subdomain},
              ${{
                primaryColor: "#3b82f6",
                secondaryColor: "#10b981",
                fontFamily: "Inter"
              }},
              ${{
                hero: {
                  title: "Welcome to My Site",
                  subtitle: "Built with MujeebProAI Themes",
                  ctaText: "Get Started"
                }
              }}
            )
          `
        }

        // Increment theme sales count
        await sql`
          UPDATE themes 
          SET sales_count = sales_count + 1 
          WHERE id = ${themeId}
        `

        console.log(`Theme purchase completed: ${themeId} by user ${userId}`)
      } catch (error) {
        console.error("Error processing purchase:", error)
      }
    }
  }

  return NextResponse.json({ received: true })
}
