"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { 
  Search, 
  FileText,
  Image as ImageIcon,
  Share2,
  Save,
  Loader2,
  Check
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

interface SEOSettings {
  meta_title: string
  meta_description: string
  meta_keywords: string
  og_title: string
  og_description: string
  og_image: string
  twitter_title: string
  twitter_description: string
}

export default function SEOSettingsPage() {
  const params = useParams()
  const siteId = params.id as string

  const { data: siteData, mutate } = useSWR(
    siteId ? `/api/customer/sites/${siteId}` : null,
    fetcher
  )

  const site = siteData?.site
  const siteConfig = site?.site_config || {}

  const [settings, setSettings] = useState<SEOSettings>({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    twitter_title: "",
    twitter_description: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (siteConfig.seo) {
      setSettings({
        meta_title: siteConfig.seo.meta_title || site?.site_name || "",
        meta_description: siteConfig.seo.meta_description || "",
        meta_keywords: siteConfig.seo.meta_keywords || "",
        og_title: siteConfig.seo.og_title || "",
        og_description: siteConfig.seo.og_description || "",
        og_image: siteConfig.seo.og_image || "",
        twitter_title: siteConfig.seo.twitter_title || "",
        twitter_description: siteConfig.seo.twitter_description || "",
      })
    } else if (site) {
      setSettings(prev => ({
        ...prev,
        meta_title: site.site_name || "",
      }))
    }
  }, [siteConfig, site])

  const handleChange = (field: keyof SEOSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const saveSettings = useCallback(async () => {
    if (!hasChanges) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          site_config: {
            ...siteConfig,
            seo: settings,
          },
        }),
      })
      if (res.ok) {
        setLastSaved(new Date())
        setHasChanges(false)
        mutate()
      }
    } catch (err) {
      console.error("Failed to save settings:", err)
    } finally {
      setIsSaving(false)
    }
  }, [settings, hasChanges, siteId, siteConfig, mutate])

  // Autosave
  useEffect(() => {
    if (!hasChanges) return
    const timer = setTimeout(() => {
      saveSettings()
    }, 2000)
    return () => clearTimeout(timer)
  }, [settings, hasChanges, saveSettings])

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Settings</h1>
          <p className="text-muted-foreground mt-1">
            Optimize your website for search engines
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Saved
            </span>
          )}
          <Button onClick={saveSettings} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Basic SEO */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Basic SEO
          </CardTitle>
          <CardDescription>Configure how your site appears in search results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">Page Title</Label>
            <Input
              id="meta_title"
              value={settings.meta_title}
              onChange={(e) => handleChange("meta_title", e.target.value)}
              placeholder="Your Business Name | Tagline"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              {settings.meta_title.length}/60 characters (recommended: 50-60)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={settings.meta_description}
              onChange={(e) => handleChange("meta_description", e.target.value)}
              placeholder="A brief description of your business that will appear in search results"
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">
              {settings.meta_description.length}/160 characters (recommended: 120-160)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_keywords">Keywords</Label>
            <Input
              id="meta_keywords"
              value={settings.meta_keywords}
              onChange={(e) => handleChange("meta_keywords", e.target.value)}
              placeholder="restaurant, food, delivery, local"
            />
            <p className="text-xs text-muted-foreground">
              Separate keywords with commas
            </p>
          </div>

          {/* Search Preview */}
          <div className="p-4 rounded-lg border border-border bg-background">
            <p className="text-xs text-muted-foreground mb-2">Search Preview</p>
            <div className="space-y-1">
              <p className="text-blue-500 text-lg truncate">
                {settings.meta_title || "Your Page Title"}
              </p>
              <p className="text-green-600 text-sm">
                {site?.subdomain}.mujeebproai.com
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {settings.meta_description || "Your meta description will appear here..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Social Media Preview
          </CardTitle>
          <CardDescription>How your site appears when shared on social media</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="og_title">Social Title</Label>
            <Input
              id="og_title"
              value={settings.og_title}
              onChange={(e) => handleChange("og_title", e.target.value)}
              placeholder="Leave empty to use page title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og_description">Social Description</Label>
            <Textarea
              id="og_description"
              value={settings.og_description}
              onChange={(e) => handleChange("og_description", e.target.value)}
              placeholder="Leave empty to use meta description"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og_image">Social Image URL</Label>
            <Input
              id="og_image"
              value={settings.og_image}
              onChange={(e) => handleChange("og_image", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x630 pixels
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
