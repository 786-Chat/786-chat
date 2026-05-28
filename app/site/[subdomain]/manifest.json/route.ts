import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params

    const [site] = await sql`
      SELECT 
        cs.site_name,
        cs.logo_url,
        css.pwa_app_name,
        css.pwa_short_name,
        css.pwa_icon_url,
        css.pwa_theme_color,
        css.pwa_background_color,
        css.primary_color
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      WHERE cs.subdomain = ${subdomain}
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Use PWA settings or fallback to site defaults
    const appName = site.pwa_app_name || site.site_name || "Restaurant"
    const shortName = site.pwa_short_name || (appName.length > 12 ? appName.substring(0, 12) : appName)
    const iconUrl = site.pwa_icon_url || site.logo_url
    const themeColor = site.pwa_theme_color || site.primary_color || "#000000"
    const backgroundColor = site.pwa_background_color || "#ffffff"

    // Generate initials icon URL if no logo
    const initialsIcon = !iconUrl ? `/api/generate-icon?name=${encodeURIComponent(appName)}&color=${encodeURIComponent(themeColor)}` : null

    const manifest = {
      name: appName,
      short_name: shortName,
      description: `${appName} - Order food online`,
      start_url: `/site/${subdomain}`,
      display: "standalone",
      orientation: "portrait",
      theme_color: themeColor,
      background_color: backgroundColor,
      icons: [
        {
          src: iconUrl || initialsIcon || "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: iconUrl || initialsIcon || "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      screenshots: [],
      categories: ["food", "shopping", "lifestyle"]
    }

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600"
      }
    })
  } catch (error) {
    console.error("Error generating manifest:", error)
    return NextResponse.json({ error: "Failed to generate manifest" }, { status: 500 })
  }
}
