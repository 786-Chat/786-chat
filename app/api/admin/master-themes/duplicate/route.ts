import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

// POST - Duplicate theme to customer site
export async function POST(request: NextRequest) {
  try {
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { theme_id, customer_email, site_name, subdomain } = await request.json()

    if (!theme_id || !customer_email || !site_name || !subdomain) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Get the theme
    const [theme] = await sql`SELECT * FROM themes WHERE id = ${theme_id}`
    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    // Find or create user
    let [user] = await sql`SELECT id FROM users WHERE email = ${customer_email}`
    if (!user) {
      // Create a new user with a random password (they can reset it)
      const randomPassword = Math.random().toString(36).slice(-12)
      const [newUser] = await sql`
        INSERT INTO users (email, name, password, role)
        VALUES (${customer_email}, ${site_name}, ${randomPassword}, 'user')
        RETURNING id
      `
      user = newUser
    }

    // Check subdomain availability
    const existing = await sql`SELECT id FROM customer_sites WHERE subdomain = ${subdomain}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Subdomain already taken" }, { status: 400 })
    }

    // Create customer site
    const [site] = await sql`
      INSERT INTO customer_sites (
        user_id, site_name, subdomain, theme_id, theme_name,
        is_active, is_published, status, modules, settings, activated_at
      ) VALUES (
        ${user.id}, ${site_name}, ${subdomain}, ${theme.id}::uuid, ${theme.name},
        true, false, 'active', ${JSON.stringify(theme.features || [])}::jsonb, '{}'::jsonb, NOW()
      )
      RETURNING *
    `

    // Create site settings
    await sql`
      INSERT INTO customer_site_settings (site_id, business_name, currency, country)
      VALUES (${site.id}, ${site_name}, 'GBP', 'UK')
    `

    // Log action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name, details)
      VALUES (
        ${payload.id}, ${payload.email}, 'theme_duplicated', 'site', ${site.id}, ${site_name},
        ${JSON.stringify({ theme_id, theme_name: theme.name, customer_email, subdomain })}::jsonb
      )
    `

    return NextResponse.json({ 
      success: true, 
      site,
      message: `Site created for ${customer_email} at ${subdomain}.mujeebproai.com`
    })
  } catch (error) {
    console.error("Failed to duplicate theme:", error)
    return NextResponse.json({ error: "Failed to duplicate theme" }, { status: 500 })
  }
}
