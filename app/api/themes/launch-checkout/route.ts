import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getStripe } from "@/lib/stripe"


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
      openingHours,
      themeOptions,
      selectedModules,
      selectedPayments,
      domainOption,
      subdomain,
      customDomain,
      googleBusiness,
      billingCycle,
      modulesPrice,
      currency,
    } = body

    // Validate subdomain availability
    if (subdomain) {
      const [existing] = await sql`
        SELECT id FROM customer_sites WHERE LOWER(subdomain) = LOWER(${subdomain})
      `
      if (existing) {
        return NextResponse.json({ error: "Subdomain is already taken" }, { status: 400 })
      }
    }

    // Create the site record first (in pending status)
    const [site] = await sql`
      INSERT INTO customer_sites (
        user_id,
        site_name,
        subdomain,
        custom_domain,
        theme_id,
        theme_name,
        status,
        is_active,
        is_published,
        modules,
        settings,
        site_config,
        site_content
      ) VALUES (
        ${payload.id},
        ${businessInfo.businessName},
        ${subdomain.toLowerCase()},
        ${customDomain || null},
        ${themeId},
        ${themeName},
        'pending_payment',
        false,
        false,
        ${JSON.stringify(selectedModules)}::jsonb,
        ${JSON.stringify({
          themeOptions,
          selectedPayments,
          billingCycle,
          googleBusiness,
        })}::jsonb,
        ${JSON.stringify({
          theme: themeOptions,
          modules: selectedModules,
          payments: selectedPayments,
        })}::jsonb,
        ${JSON.stringify({
          hero: {
            title: `Welcome to ${businessInfo.businessName}`,
            subtitle: businessInfo.description || "Delicious food, delivered to your door",
          },
        })}::jsonb
      )
      RETURNING id
    `

    // Create site settings
    await sql`
      INSERT INTO customer_site_settings (
        site_id,
        business_name,
        owner_name,
        country,
        currency,
        address,
        phone,
        whatsapp,
        email,
        business_category,
        payment_methods,
        google_assisted_setup,
        google_setup_requested_at,
        google_business_profile_url
      ) VALUES (
        ${site.id},
        ${businessInfo.businessName},
        ${payload.name || businessInfo.businessName},
        ${businessInfo.country},
        ${currency},
        ${businessInfo.address},
        ${businessInfo.phone},
        ${businessInfo.whatsapp || businessInfo.phone},
        ${businessInfo.email},
        ${businessInfo.category},
        ${JSON.stringify(selectedPayments)}::jsonb,
        ${googleBusiness.assistedSetup},
        ${googleBusiness.assistedSetup ? new Date().toISOString() : null},
        ${googleBusiness.existingProfileUrl || null}
      )
    `

    // Calculate total
    const totalAmount = themePrice + modulesPrice

    // Create Stripe checkout session line items
    const themePriceData = {
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `${themeName} Theme`,
          description: `Website theme for ${businessInfo.businessName}`,
        },
        unit_amount: themePrice,
      },
      quantity: 1,
    }

    // Add modules subscription if any
    const modulesPriceData = modulesPrice > 0 ? {
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: "Website Modules",
          description: `${selectedModules.length} modules (${billingCycle})`,
        },
        unit_amount: modulesPrice,
        recurring: {
          interval: billingCycle === "yearly" ? "year" as const : "month" as const,
        },
      },
      quantity: 1,
    } : null

    const session = await getStripe().checkout.sessions.create({
      mode: modulesPrice > 0 ? "subscription" : "payment",
      customer_email: payload.email,
      line_items: modulesPrice > 0 
        ? [themePriceData, modulesPriceData!] 
        : [themePriceData],
      metadata: {
        userId: payload.id,
        siteId: site.id,
        themeId,
        themeName,
        subdomain: subdomain.toLowerCase(),
        businessName: businessInfo.businessName,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"}/generate-website?session_id={CHECKOUT_SESSION_ID}&site_id=${site.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"}/themes/${themeId}`,
    })

    return NextResponse.json({ 
      url: session.url,
      siteId: site.id,
    })
  } catch (error) {
    console.error("Launch checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
