import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/features", "/pricing", "/examples", "/docs", "/about", "/support", "/security", "/privacy", "/terms"],
      disallow: ["/api/", "/admin/", "/dashboard/", "/786-admin/"],
    },
    sitemap: "https://786.chat/sitemap.xml",
  }
}
