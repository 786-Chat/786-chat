import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [settings] = await sql`
      SELECT 
        cs.site_name,
        cs.logo_url,
        cs.subdomain,
        css.pwa_app_name,
        css.pwa_short_name,
        css.pwa_icon_url,
        css.pwa_favicon_url,
        css.pwa_splash_url,
        css.pwa_theme_color,
        css.pwa_background_color,
        css.primary_color
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      WHERE cs.id = ${id}
    `

    if (!settings) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching PWA settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      pwa_app_name,
      pwa_short_name,
      pwa_icon_url,
      pwa_favicon_url,
      pwa_splash_url,
      pwa_theme_color,
      pwa_background_color
    } = body

    await sql`
      UPDATE customer_site_settings
      SET 
        pwa_app_name = ${pwa_app_name},
        pwa_short_name = ${pwa_short_name},
        pwa_icon_url = ${pwa_icon_url},
        pwa_favicon_url = ${pwa_favicon_url},
        pwa_splash_url = ${pwa_splash_url},
        pwa_theme_color = ${pwa_theme_color},
        pwa_background_color = ${pwa_background_color},
        updated_at = NOW()
      WHERE site_id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating PWA settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
