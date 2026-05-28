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

    const body = await request.json()
    const {
      themeId,
      themeName,
      themePrice,
      businessInfo,
      themeOptions,
      selectedModules,
      domainOption,
      subdomain,
      customDomain,
      billingCycle,
      totalPrice,
    } = body

    // Validate subdomain availability
    if (domainOption === "subdomain" && subdomain) {
      const existing = await sql`
        SELECT id FROM customer_sites WHERE subdomain = ${subdomain.toLowerCase()}
      `
      if (existing.length > 0) {
        return NextResponse.json({ error: "Subdomain already taken" }, { status: 400 })
      }
    }

    // Create pending customer site record
    const [site] = await sql`
      INSERT INTO customer_sites (
        user_id,
        theme_id,
        theme_name,
        site_name,
        subdomain,
        custom_domain,
        status,
        settings,
        modules,
        created_at
      ) VALUES (
        ${payload.id},
        ${themeId},
        ${themeName},
        ${businessInfo.businessName},
        ${subdomain?.toLowerCase() || null},
        ${customDomain || null},
        'pending',
        ${JSON.stringify({
          businessInfo,
          themeOptions,
          billingCycle,
        })}::jsonb,
        ${JSON.stringify(selectedModules)}::jsonb,
        NOW()
      )
      RETURNING id
    `

    // Create site settings record
    await sql`
      INSERT INTO customer_site_settings (
        site_id,
        business_name,
        owner_name,
        email,
        phone,
        whatsapp,
        address,
        country,
        currency
      ) VALUES (
        ${site.id},
        ${businessInfo.businessName},
        ${businessInfo.ownerName || null},
        ${businessInfo.email},
        ${businessInfo.phone},
        ${businessInfo.whatsapp || null},
        ${businessInfo.address || null},
        ${businessInfo.country},
        ${businessInfo.currency}
      )
    `

    // Calculate line items for Stripe
    const lineItems = [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `${themeName} Theme`,
            description: `MujeebProAI Website - ${domainOption === "subdomain" ? `${subdomain}.mujeebproai.com` : customDomain}`,
          },
          unit_amount: Math.round(themePrice * 100),
          recurring: {
            interval: billingCycle === "yearly" ? "year" as const : "month" as const,
          },
        },
        quantity: 1,
      },
    ]

    // Add module line items
    const modulesPricing: Record<string, number> = {
      driver: 999,
      kitchen: 799,
      whatsapp: 599,
      booking: 899,
      loyalty: 699,
      qrmenu: 499,
      multibranch: 1499,
      printing: 599,
    }

    for (const moduleId of selectedModules) {
      const price = modulesPricing[moduleId as keyof typeof modulesPricing]
      if (price) {
        const moduleName = moduleId.charAt(0).toUpperCase() + moduleId.slice(1)
        lineItems.push({
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${moduleName} Module`,
              description: `Add-on module for your website`,
            },
            unit_amount: price,
            recurring: {
              interval: billingCycle === "yearly" ? "year" as const : "month" as const,
            },
          },
          quantity: 1,
        })
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: businessInfo.email,
      line_items: lineItems,
      metadata: {
        userId: payload.id,
        siteId: site.id,
        themeId,
        themeName,
        subdomain: subdomain || "",
        customDomain: customDomain || "",
        type: "website_setup",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"}/themes/setup-success?session_id={CHECKOUT_SESSION_ID}&site_id=${site.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"}/themes/${themeId}`,
      subscription_data: {
        metadata: {
          siteId: site.id,
          userId: payload.id,
        },
      },
    })

    return NextResponse.json({ url: session.url, siteId: site.id })
  } catch (error) {
    console.error("Wizard checkout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout" },
      { status: 500 }
    )
  }
}
