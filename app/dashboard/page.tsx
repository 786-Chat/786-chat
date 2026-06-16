"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Globe,
  LayoutDashboard,
  Loader2,
  Plus,
  ExternalLink,
  Settings,
} from "lucide-react"

const OWNER_EMAILS = ["mujeeb@job4u.com"]

interface CustomerSite {
  id: string
  site_name: string
  subdomain: string
  custom_domain: string | null
  logo_url: string | null
  is_published: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  theme_name: string | null
  theme_slug: string | null
  theme_thumbnail: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [sites, setSites] = useState<CustomerSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" })

        if (!meRes.ok) {
          router.replace("/login")
          return
        }

        const meData = await meRes.json()
        const user = meData?.user || meData?.session || meData
        const email = String(user?.email || "").trim().toLowerCase()

        if (OWNER_EMAILS.includes(email)) {
          router.replace("/dashboard/chat")
          return
        }

        const sitesRes = await fetch("/api/customer/sites", { cache: "no-store" })

        if (!sitesRes.ok) {
          if (!cancelled) setSites([])
          return
        }

        const sitesData = await sitesRes.json()

        if (!cancelled) {
          setSites(Array.isArray(sitesData?.sites) ? sitesData.sites : [])
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error)
        if (!cancelled) setSites([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="text-white/50 mt-2">
              Create, manage and edit your MujeebProAI projects.
            </p>
          </div>

          <Link
            href="/themes"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>

        {sites.length === 0 ? (
          <div className="border border-white/10 rounded-2xl bg-white/[0.03] p-10 text-center">
            <Globe className="w-12 h-12 mx-auto text-cyan-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
            <p className="text-white/50 mb-6">
              Choose a theme and create your first customer website.
            </p>
            <Link
              href="/themes"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Select Theme
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sites.map((site) => {
              const liveUrl = site.custom_domain
                ? `https://${site.custom_domain}`
                : `https://${site.subdomain}.mujeebproai.com`

              return (
                <div
                  key={site.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] overflow-hidden hover:border-cyan-400/40 transition-colors"
                >
                  <div className="h-40 bg-black/40 border-b border-white/10 flex items-center justify-center">
                    {site.theme_thumbnail ? (
                      <img
                        src={site.theme_thumbnail}
                        alt={site.theme_name || site.site_name}
                        className="w-full h-full object-cover"
                      />
                    ) : site.logo_url ? (
                      <img
                        src={site.logo_url}
                        alt={site.site_name}
                        className="w-20 h-20 object-contain rounded-xl"
                      />
                    ) : (
                      <Globe className="w-14 h-14 text-cyan-400" />
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h2 className="text-xl font-bold">{site.site_name}</h2>
                        <p className="text-sm text-white/45">
                          {site.theme_name || "Custom Theme"}
                        </p>
                      </div>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          site.is_published
                            ? "bg-green-500/15 text-green-400"
                            : "bg-yellow-500/15 text-yellow-400"
                        }`}
                      >
                        {site.is_published ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="text-sm text-white/50 mb-5 break-all">
                      {liveUrl}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href={`/dashboard/sites/${site.id}`}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin
                      </Link>

                      <Link
                        href={`/dashboard/sites/${site.id}/builder`}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Builder
                      </Link>

                      <Link
                        href={`/dashboard/sites/${site.id}/chat`}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors"
                      >
                        AI Chat
                      </Link>

                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Live
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
