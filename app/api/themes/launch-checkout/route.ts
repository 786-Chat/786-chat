import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getStripe } from "@/lib/stripe"

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

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

    if (!themeId || !themeName || !businessInfo?.businessName) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    const finalSubdomain =
      subdomain && subdomain.trim()
        ? makeSlug(subdomain)
        : `${makeSlug(businessInfo.businessName)}-${Date.now().toString().slice(-5)}`

    if (!finalSubdomain || finalSubdomain.length < 3) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 })
    }

    const currencyCode = (currency || "GBP").toLowerCase()
    const themeAmount = Number(themePrice || 0)
    const moduleAmount = Number(modulesPrice || 0)

    const [existing] = await sql`
      SELECT id FROM customer_sites WHERE LOWER(subdomain) = LOWER(${finalSubdomain})
    `

    if (existing) {
      return NextResponse.json({ error: "Subdomain is already taken" }, { status: 400 })
    }

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
        ${finalSubdomain},
        ${customDomain || null},
        ${themeId},
        ${themeName},
        'pending_payment',
        false,
        false,
        ${JSON.stringify(selectedModules || [])}::jsonb,
        ${JSON.stringify({
          themeOptions,
          selectedPayments,
          billingCycle,
          googleBusiness,
          openingHours,
        })}::jsonb,
        ${JSON.stringify({
          theme: themeOptions,
          modules: selectedModules || [],
          payments: selectedPayments || [],
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
        ${businessInfo.country || "United Kingdom"},
        ${currency || "GBP"},
        ${businessInfo.address || ""},
        ${businessInfo.phone || ""},
        ${businessInfo.whatsapp || businessInfo.phone || ""},
        ${businessInfo.email || payload.email || ""},
        ${businessInfo.category || "restaurant"},
        ${JSON.stringify(selectedPayments || [])}::jsonb,
        ${Boolean(googleBusiness?.assistedSetup)},
        ${googleBusiness?.assistedSetup ? new Date().toISOString() : null},
        ${googleBusiness?.existingProfileUrl || null}
      )
    `

    const stripe = getStripe()

    const themePriceData = {
      price_data: {
        currency: currencyCode,
        product_data: {
          name: `${themeName} Theme`,
          description: `Website theme for ${businessInfo.businessName}`,
        },
        unit_amount: themeAmount,
      },
      quantity: 1,
    }

    const modulesPriceData =
  moduleAmount > 0
    ? {
...
    : null
            price_data: {
              currency: currencyCode,
              product_data: {
                name: "Website Modules",
                description: `${(selectedModules || []).length} modules (${billingCycle})`,
              },
              unit_amount: moduleAmount,
              recurring: {
                interval: billingCycle === "yearly" ? ("year" as const) : ("month" as const),
              },
            },
            quantity: 1,
          }
        : null

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"

  const session = await stripe.checkout.sessions.create({
  mode: "payment",
  customer_email: payload.email,
  line_items: [themePriceData],
      metadata: {
        userId: String(payload.id),
        siteId: String(site.id),
        themeId: String(themeId),
        themeName: String(themeName),
        subdomain: String(finalSubdomain),
        businessName: String(businessInfo.businessName),
      },
      success_url: `${appUrl}/generate-website?session_id={CHECKOUT_SESSION_ID}&site_id=${site.id}`,
      cancel_url: `${appUrl}/themes/${themeId}`,
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
