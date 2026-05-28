import { Metadata } from "next"
import { sql } from "@/lib/db"

interface Props {
  params: Promise<{ subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params

  try {
    const [site] = await sql`
      SELECT 
        cs.site_name,
        cs.logo_url,
        css.pwa_app_name,
        css.pwa_icon_url,
        css.pwa_favicon_url,
        css.pwa_theme_color,
        css.primary_color
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      WHERE cs.subdomain = ${subdomain}
    `

    if (!site) {
      return {
        title: "Site Not Found"
      }
    }

    const appName = site.pwa_app_name || site.site_name || "Restaurant"
    const iconUrl = site.pwa_icon_url || site.pwa_favicon_url || site.logo_url
    const themeColor = site.pwa_theme_color || site.primary_color || "#3b82f6"

    return {
      title: appName,
      description: `${appName} - Order food online`,
      manifest: `/site/${subdomain}/manifest.json`,
      themeColor: themeColor,
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: appName,
      },
      icons: iconUrl ? [
        { url: iconUrl, sizes: "192x192", type: "image/png" },
        { url: iconUrl, sizes: "512x512", type: "image/png" },
        { rel: "apple-touch-icon", url: iconUrl },
      ] : undefined,
      other: {
        "mobile-web-app-capable": "yes",
        "apple-mobile-web-app-capable": "yes",
        "application-name": appName,
        "apple-mobile-web-app-title": appName,
        "msapplication-TileColor": themeColor,
      }
    }
  } catch {
    return {
      title: "Restaurant"
    }
  }
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
