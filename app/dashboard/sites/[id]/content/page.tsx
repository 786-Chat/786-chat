"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Building2, 
  MapPin, 
  Phone, 
  MessageCircle,
  Mail,
  Clock,
  Link as LinkIcon,
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

interface SiteSettings {
  business_name: string
  owner_name: string
  address: string
  phone: string
  whatsapp: string
  email: string
  opening_hours: string
  facebook: string
  instagram: string
  twitter: string
  linkedin: string
  tiktok: string
  youtube: string
}

export default function WebsiteContentPage() {
  const params = useParams()
  const siteId = params.id as string

  const { data: siteData, mutate } = useSWR(
    siteId ? `/api/customer/sites/${siteId}` : null,
    fetcher
  )

  const { data: settingsData, mutate: mutateSettings } = useSWR(
    siteId ? `/api/customer/sites/${siteId}/settings` : null,
    fetcher
  )

  const [settings, setSettings] = useState<SiteSettings>({
    business_name: "",
    owner_name: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    opening_hours: "",
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    tiktok: "",
    youtube: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (settingsData?.settings) {
      setSettings({
        business_name: settingsData.settings.business_name || "",
        owner_name: settingsData.settings.owner_name || "",
        address: settingsData.settings.address || "",
        phone: settingsData.settings.phone || "",
        whatsapp: settingsData.settings.whatsapp || "",
        email: settingsData.settings.email || "",
        opening_hours: settingsData.settings.opening_hours || "",
        facebook: settingsData.settings.facebook || "",
        instagram: settingsData.settings.instagram || "",
        twitter: settingsData.settings.twitter || "",
        linkedin: settingsData.settings.linkedin || "",
        tiktok: settingsData.settings.tiktok || "",
        youtube: settingsData.settings.youtube || "",
      })
    }
  }, [settingsData])

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // Autosave with debounce
  const saveSettings = useCallback(async () => {
    if (!hasChanges) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setLastSaved(new Date())
        setHasChanges(false)
        mutateSettings()
      }
    } catch (err) {
      console.error("Failed to save settings:", err)
    } finally {
      setIsSaving(false)
    }
  }, [settings, hasChanges, siteId, mutateSettings])

  // Autosave after 2 seconds of no changes
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
          <h1 className="text-2xl font-bold">Website Content</h1>
          <p className="text-muted-foreground mt-1">
            Manage your business information and contact details
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Saved {lastSaved.toLocaleTimeString()}
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

      {/* Business Details */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Business Details
          </CardTitle>
          <CardDescription>Basic information about your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={settings.business_name}
                onChange={(e) => handleChange("business_name", e.target.value)}
                placeholder="Your Business Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner Name</Label>
              <Input
                id="owner_name"
                value={settings.owner_name}
                onChange={(e) => handleChange("owner_name", e.target.value)}
                placeholder="Owner / Contact Name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={settings.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Full business address"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Contact Information
          </CardTitle>
          <CardDescription>How customers can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+44 123 456 7890"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="whatsapp"
                  value={settings.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  placeholder="+44 123 456 7890"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contact@yourbusiness.com"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opening Hours */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Opening Hours
          </CardTitle>
          <CardDescription>When customers can visit or contact you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="opening_hours">Opening Hours</Label>
            <Textarea
              id="opening_hours"
              value={settings.opening_hours}
              onChange={(e) => handleChange("opening_hours", e.target.value)}
              placeholder="Monday - Friday: 9am - 6pm&#10;Saturday: 10am - 4pm&#10;Sunday: Closed"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Enter each day on a new line
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            Social Media Links
          </CardTitle>
          <CardDescription>Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={settings.facebook}
                onChange={(e) => handleChange("facebook", e.target.value)}
                placeholder="https://facebook.com/yourbusiness"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={settings.instagram}
                onChange={(e) => handleChange("instagram", e.target.value)}
                placeholder="https://instagram.com/yourbusiness"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input
                id="twitter"
                value={settings.twitter}
                onChange={(e) => handleChange("twitter", e.target.value)}
                placeholder="https://twitter.com/yourbusiness"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={settings.linkedin}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/company/yourbusiness"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                value={settings.tiktok}
                onChange={(e) => handleChange("tiktok", e.target.value)}
                placeholder="https://tiktok.com/@yourbusiness"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={settings.youtube}
                onChange={(e) => handleChange("youtube", e.target.value)}
                placeholder="https://youtube.com/@yourbusiness"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
