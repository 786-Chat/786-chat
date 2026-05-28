import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify site ownership
    const [site] = await sql`
      SELECT id FROM customer_sites 
      WHERE id = ${id} AND user_id = ${payload.id}
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Get settings
    const [settings] = await sql`
      SELECT * FROM customer_site_settings WHERE site_id = ${id}
    `

    return NextResponse.json({ settings: settings || {} })
  } catch (error) {
    console.error("Error fetching site settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify site ownership
    const [site] = await sql`
      SELECT id FROM customer_sites 
      WHERE id = ${id} AND user_id = ${payload.id}
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
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
      opening_hours,
      facebook,
      instagram,
      twitter,
      linkedin,
      tiktok,
      youtube,
      printer_settings,
    } = body

    // Check if settings exist
    const [existing] = await sql`
      SELECT id FROM customer_site_settings WHERE site_id = ${id}
    `

    let settings
    if (existing) {
      // Update
      ;[settings] = await sql`
        UPDATE customer_site_settings SET
          business_name = COALESCE(${business_name}, business_name),
          owner_name = COALESCE(${owner_name}, owner_name),
          country = COALESCE(${country}, country),
          currency = COALESCE(${currency}, currency),
          address = COALESCE(${address}, address),
          phone = COALESCE(${phone}, phone),
          whatsapp = COALESCE(${whatsapp}, whatsapp),
          email = COALESCE(${email}, email),
          business_category = COALESCE(${business_category}, business_category),
          payment_methods = COALESCE(${payment_methods ? JSON.stringify(payment_methods) : null}::jsonb, payment_methods),
          printer_settings = COALESCE(${printer_settings ? JSON.stringify(printer_settings) : null}::jsonb, printer_settings),
          updated_at = NOW()
        WHERE site_id = ${id}
        RETURNING *
      `

      // Store social links in site_content
      if (opening_hours || facebook || instagram || twitter || linkedin || tiktok || youtube) {
        await sql`
          UPDATE customer_sites SET
            site_content = jsonb_set(
              COALESCE(site_content, '{}'::jsonb),
              '{social}',
              ${JSON.stringify({
                opening_hours,
                facebook,
                instagram,
                twitter,
                linkedin,
                tiktok,
                youtube,
              })}::jsonb
            ),
            updated_at = NOW()
          WHERE id = ${id}
        `
      }
    } else {
      // Insert
      ;[settings] = await sql`
        INSERT INTO customer_site_settings (
          site_id, business_name, owner_name, country, currency, 
          address, phone, whatsapp, email, business_category, payment_methods
        ) VALUES (
          ${id}, ${business_name}, ${owner_name}, ${country}, ${currency || 'GBP'},
          ${address}, ${phone}, ${whatsapp}, ${email}, ${business_category},
          ${payment_methods ? JSON.stringify(payment_methods) : '{"cash": true}'}::jsonb
        )
        RETURNING *
      `
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error updating site settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
