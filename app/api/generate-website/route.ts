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

// Send email via Resend (if RESEND_API_KEY is set) or fallback to console log
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject} | (No RESEND_API_KEY configured, email logged)`)
    console.log(`[EMAIL] HTML: ${html.substring(0, 200)}...`)
    return
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MujeebProAI <noreply@mujeebproai.com>",
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`[EMAIL] Failed to send email via Resend: ${errBody}`)
    } else {
      console.log(`[EMAIL] Sent successfully to ${to}`)
    }
  } catch (err) {
    console.error(`[EMAIL] Error sending email:`, err)
  }
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

    // 1. Verify the Stripe session server-side
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "payment_intent", "line_items"],
    })

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    // 2. Get the site record
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

    // 3. Generate manager credentials
    const managerEmail = `manager@${site.subdomain}.mujeebproai.com`
    const managerPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(managerPassword, 10)

    // 4. Create manager user in restaurant_users table
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

    // 5. Extract settings from site_config
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

    // 6. Activate the site: update status, save stripe_session_id, payment details
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null

    const amountPaid = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00"
    const currencyCode = session.currency?.toUpperCase() || "GBP"

    await sql`
      UPDATE customer_sites 
      SET 
        status = 'active',
        is_active = true,
        is_published = true,
        activated_at = NOW(),
        site_content = ${JSON.stringify(generatedContent)},
        stripe_session_id = ${sessionId},
        stripe_payment_intent_id = ${paymentIntentId},
        stripe_subscription_id = ${session.subscription || session.payment_intent},
        payment_status = 'paid',
        payment_amount = ${parseFloat(amountPaid)},
        payment_currency = ${currencyCode},
        paid_at = NOW()
      WHERE id = ${siteId}
    `

    // 7. Update settings with payment status
    await sql`
      UPDATE customer_site_settings 
      SET 
        payment_status = 'paid',
        updated_at = NOW()
      WHERE site_id = ${siteId}
    `

    // 8. Build response data
    const siteUrl = `https://${site.subdomain}.mujeebproai.com`
    const dashboardUrl = `/dashboard/sites/${siteId}`

    // 9. Send customer confirmation email
    const customerEmail = site.email || payload.email
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: `🎉 Your website ${site.business_name || site.site_name} is now LIVE!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; background: #0a0a0f; color: #e2e8f0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
              <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🎉 Your Website is Live!</h1>
                <p style="margin-top: 8px; color: rgba(255,255,255,0.85); font-size: 16px;">${site.business_name || site.site_name}</p>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; line-height: 1.6;">Congratulations! Your professional website has been created and is now published.</p>
                
                <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;">🌐 Your Live Website</p>
                  <a href="${siteUrl}" style="color: #818cf8; font-size: 18px; font-weight: bold; text-decoration: none;">${siteUrl}</a>
                </div>

                <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;">🔑 Manager Login Credentials</p>
                  <p style="margin: 4px 0;"><strong>Email:</strong> ${managerEmail}</p>
                  <p style="margin: 4px 0;"><strong>Password:</strong> ${managerPassword}</p>
                  <p style="margin: 12px 0 0 0; font-size: 12px; color: #f59e0b;">⚠️ Please save these credentials securely. You can change the password later.</p>
                </div>

                <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;">📊 Dashboard</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.mujeebproai.com'}${dashboardUrl}" style="color: #818cf8; text-decoration: none;">Manage your website →</a>
                </div>

                <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;">💳 Payment Receipt</p>
                  <p style="margin: 4px 0;"><strong>Amount:</strong> ${currencyCode} ${amountPaid}</p>
                  <p style="margin: 4px 0;"><strong>Session ID:</strong> ${sessionId}</p>
                </div>

                <p style="font-size: 14px; color: #94a3b8; margin-top: 24px;">
                  Need help? Reply to this email or contact our support team.
                </p>
                <p style="font-size: 14px; color: #94a3b8;">
                  Best regards,<br/>The MujeebProAI Team
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      })
    }

    // 10. Send admin notification email to mujeeb@job4u.com
    await sendEmail({
      to: "mujeeb@job4u.com",
      subject: `🔔 New Website Launched: ${site.business_name || site.site_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background: #0a0a0f; color: #e2e8f0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
            <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🔔 New Website Launched</h1>
            </div>
            <div style="padding: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #94a3b8;">Business Name</td><td style="padding: 8px 0; font-weight: bold;">${site.business_name || site.site_name}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Customer</td><td style="padding: 8px 0; font-weight: bold;">${payload.name || payload.email}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Customer Email</td><td style="padding: 8px 0; font-weight: bold;">${payload.email}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Website URL</td><td style="padding: 8px 0;"><a href="${siteUrl}" style="color: #818cf8;">${siteUrl}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Theme</td><td style="padding: 8px 0; font-weight: bold;">${site.theme_name}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Subdomain</td><td style="padding: 8px 0; font-weight: bold;">${site.subdomain}.mujeebproai.com</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Payment</td><td style="padding: 8px 0; font-weight: bold;">${currencyCode} ${amountPaid} - Paid ✅</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Stripe Session</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${sessionId}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">User ID</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${payload.id}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Site ID</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${siteId}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Manager Email</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${managerEmail}</td></tr>
              </table>

              <div style="margin-top: 24px; padding: 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.mujeebproai.com'}/admin/sites/${siteId}" style="color: #818cf8;">Open Admin Dashboard →</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

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
