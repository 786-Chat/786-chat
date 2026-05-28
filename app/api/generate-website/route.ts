import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { stripe, getStripe } from "@/lib/stripe"
import Stripe from "stripe"
import bcrypt from "bcryptjs"


// Generate a random password for manager
function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getSession()
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId, siteId } = await request.json()

    if (!sessionId || !siteId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    // Get the site record
    const [site] = await sql`
      SELECT 
        cs.*,
        css.business_name,
        css.phone,
        css.whatsapp,
        css.email,
        css.address,
        css.owner_name,
        css.country,
        css.currency
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON css.site_id = cs.id
      WHERE cs.id = ${siteId} AND cs.user_id = ${payload.id}
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Generate manager credentials
    const managerEmail = `manager@${site.subdomain}.mujeebproai.com`
    const managerPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(managerPassword, 10)

    // Create manager user in restaurant_users table
    const [existingManager] = await sql`
      SELECT id FROM restaurant_users 
      WHERE site_id = ${siteId} AND role = 'manager'
    `

    if (!existingManager) {
      await sql`
        INSERT INTO restaurant_users (
          site_id,
          name,
          email,
          pin,
          role,
          is_active
        ) VALUES (
          ${siteId},
          ${site.owner_name || 'Manager'},
          ${managerEmail},
          ${hashedPassword},
          'manager',
          true
        )
      `
    }

    // Extract settings from site_config
    const siteConfig = site.site_config || {}
    const siteContent = site.site_content || {}
    const settings = site.settings || {}
    
    // Build the site content structure with all pages
    const generatedContent = {
      homepage: {
        hero: {
          title: site.business_name || site.site_name,
          subtitle: siteConfig.tagline || `Welcome to ${site.business_name || site.site_name}`,
          backgroundImage: siteConfig.heroImage || null,
        },
        features: siteConfig.features || [],
        aboutPreview: siteConfig.aboutPreview || `Discover the best experience at ${site.business_name}`,
      },
      menu: {
        title: "Our Menu",
        categories: siteContent.menuCategories || [],
        items: siteContent.menuItems || [],
      },
      about: {
        title: "About Us",
        content: siteConfig.aboutContent || `${site.business_name || site.site_name} is dedicated to providing exceptional service and quality.`,
        story: siteConfig.story || "",
        mission: siteConfig.mission || "",
        team: siteConfig.team || [],
      },
      contact: {
        title: "Contact Us",
        phone: site.phone,
        whatsapp: site.whatsapp,
        email: site.email,
        address: site.address,
        openingHours: siteConfig.openingHours || settings.openingHours || {},
        mapLocation: {
          lat: settings.latitude || null,
          lng: settings.longitude || null,
        },
      },
      gallery: {
        title: "Gallery",
        images: siteContent.gallery || [],
      },
    }

    // Update the site with generated content and activate it
    await sql`
      UPDATE customer_sites 
      SET 
        status = 'active',
        is_active = true,
        is_published = true,
        activated_at = NOW(),
        site_content = ${JSON.stringify(generatedContent)},
        stripe_subscription_id = ${session.subscription || session.payment_intent}
      WHERE id = ${siteId}
    `

    // Update settings with payment status
    await sql`
      UPDATE customer_site_settings 
      SET 
        payment_status = 'paid',
        updated_at = NOW()
      WHERE site_id = ${siteId}
    `

    // Build response data
    const siteUrl = `https://${site.subdomain}.mujeebproai.com`
    const dashboardUrl = `/dashboard/sites/${siteId}`

    return NextResponse.json({
      success: true,
      site: {
        siteId: siteId,
        siteName: site.site_name,
        subdomain: site.subdomain,
        siteUrl: siteUrl,
        dashboardUrl: dashboardUrl,
        managerEmail: managerEmail,
        managerPassword: managerPassword,
        themeName: site.theme_name,
        businessName: site.business_name || site.site_name,
        status: "published",
      },
    })
  } catch (error) {
    console.error("Generate website error:", error)
    return NextResponse.json(
      { error: "Failed to generate website" },
      { status: 500 }
    )
  }
}
