import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://786.chat"
  const routes: Array<{
    path: string
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>
    priority: number
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/features", changeFrequency: "monthly", priority: 0.9 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
    { path: "/examples", changeFrequency: "monthly", priority: 0.8 },
    { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/support", changeFrequency: "monthly", priority: 0.6 },
    { path: "/security", changeFrequency: "monthly", priority: 0.6 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
  ]

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date("2026-08-03"),
    changeFrequency,
    priority,
  }))
}
