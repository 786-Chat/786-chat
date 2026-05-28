"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { MenuPage } from "@/components/ordering/menu-page"

interface Site {
  id: string
  site_name: string
  subdomain: string
  logo_url: string | null
  site_config: {
    primaryColor?: string
  }
}

interface Settings {
  delivery_enabled: boolean
  collection_enabled: boolean
  delivery_charge_amount: number
  free_delivery_above: number | null
  vat_enabled: boolean
  vat_percentage: number
  service_charge_enabled: boolean
  service_charge_type: string
  service_charge_amount: number
  minimum_order_delivery: number
}

export default function OrderPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const [site, setSite] = useState<Site | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch site info
        const siteRes = await fetch(`/api/sites/${subdomain}`)
        if (!siteRes.ok) {
          setError("Site not found")
          return
        }
        const siteData = await siteRes.json()
        setSite(siteData.site)

        // Fetch site settings
        const settingsRes = await fetch(`/api/sites/${subdomain}/settings`)
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          setSettings(settingsData.settings)
        }
      } catch (err) {
        setError("Failed to load menu")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [subdomain])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Not Found</h1>
          <p className="text-gray-600">{error || "This restaurant menu is not available."}</p>
        </div>
      </div>
    )
  }

  return (
    <MenuPage
      siteId={site.id}
      subdomain={subdomain}
      siteName={site.site_name}
      logoUrl={site.logo_url}
      primaryColor={site.site_config?.primaryColor || "#f97316"}
      settings={settings || undefined}
    />
  )
}
