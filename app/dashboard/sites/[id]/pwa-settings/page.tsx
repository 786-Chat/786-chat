"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Smartphone, Monitor, RefreshCw, Check, Eye } from "lucide-react"
import { toast } from "sonner"

interface PWASettings {
  pwa_app_name: string
  pwa_short_name: string
  pwa_icon_url: string
  pwa_favicon_url: string
  pwa_splash_url: string
  pwa_theme_color: string
  pwa_background_color: string
  site_name: string
  logo_url: string
  primary_color: string
  subdomain: string
}

export default function PWASettingsPage() {
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<PWASettings | null>(null)
  const [formData, setFormData] = useState({
    pwa_app_name: "",
    pwa_short_name: "",
    pwa_icon_url: "",
    pwa_favicon_url: "",
    pwa_splash_url: "",
    pwa_theme_color: "#3b82f6",
    pwa_background_color: "#ffffff"
  })

  useEffect(() => {
    fetchSettings()
  }, [params.id])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/customer/sites/${params.id}/pwa-settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setFormData({
          pwa_app_name: data.pwa_app_name || data.site_name || "",
          pwa_short_name: data.pwa_short_name || "",
          pwa_icon_url: data.pwa_icon_url || data.logo_url || "",
          pwa_favicon_url: data.pwa_favicon_url || data.logo_url || "",
          pwa_splash_url: data.pwa_splash_url || "",
          pwa_theme_color: data.pwa_theme_color || data.primary_color || "#3b82f6",
          pwa_background_color: data.pwa_background_color || "#ffffff"
        })
      }
    } catch {
      toast.error("Failed to load PWA settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/customer/sites/${params.id}/pwa-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("PWA settings saved successfully")
        fetchSettings()
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/)
    return words.length >= 2 
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  const getDisplayIcon = () => {
    if (formData.pwa_icon_url) return formData.pwa_icon_url
    return null // Will show initials
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">App Icon & PWA Settings</h1>
        <p className="text-muted-foreground">
          Customize how your website appears when customers add it to their home screen
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Name</CardTitle>
              <CardDescription>
                The name shown when customers install your website as an app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full App Name</Label>
                <Input
                  value={formData.pwa_app_name}
                  onChange={(e) => setFormData({ ...formData, pwa_app_name: e.target.value })}
                  placeholder="e.g. Al-Baik Fried Chicken"
                />
                <p className="text-xs text-muted-foreground">
                  Shown in app launcher and settings
                </p>
              </div>
              <div className="space-y-2">
                <Label>Short Name (max 12 chars)</Label>
                <Input
                  value={formData.pwa_short_name}
                  onChange={(e) => setFormData({ ...formData, pwa_short_name: e.target.value.slice(0, 12) })}
                  placeholder="e.g. Al-Baik"
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground">
                  Shown under the home screen icon
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Icons</CardTitle>
              <CardDescription>
                Upload your logo for home screen and favicon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>App Icon URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.pwa_icon_url}
                    onChange={(e) => setFormData({ ...formData, pwa_icon_url: e.target.value })}
                    placeholder="https://example.com/icon.png"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 512x512px PNG with transparent background
                </p>
              </div>
              <div className="space-y-2">
                <Label>Favicon URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.pwa_favicon_url}
                    onChange={(e) => setFormData({ ...formData, pwa_favicon_url: e.target.value })}
                    placeholder="https://example.com/favicon.png"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shown in browser tab. Recommended: 32x32px
                </p>
              </div>
              <div className="space-y-2">
                <Label>Splash Screen Image (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.pwa_splash_url}
                    onChange={(e) => setFormData({ ...formData, pwa_splash_url: e.target.value })}
                    placeholder="https://example.com/splash.png"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>
                Customize the browser and app theme colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Theme Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.pwa_theme_color}
                      onChange={(e) => setFormData({ ...formData, pwa_theme_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.pwa_theme_color}
                      onChange={(e) => setFormData({ ...formData, pwa_theme_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Browser toolbar color
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.pwa_background_color}
                      onChange={(e) => setFormData({ ...formData, pwa_background_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.pwa_background_color}
                      onChange={(e) => setFormData({ ...formData, pwa_background_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Splash screen background
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save PWA Settings
              </>
            )}
          </Button>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview
              </CardTitle>
              <CardDescription>
                See how your app will appear on home screens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mobile Home Screen Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Smartphone className="w-4 h-4" />
                  Mobile Home Screen
                </div>
                <div 
                  className="rounded-2xl p-6 flex flex-col items-center justify-center"
                  style={{ backgroundColor: formData.pwa_background_color }}
                >
                  <div className="grid grid-cols-4 gap-4">
                    {/* Other app icons placeholder */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-14 h-14 rounded-xl bg-gray-300" />
                        <span className="text-[10px] text-gray-500">App</span>
                      </div>
                    ))}
                    {/* Your app icon */}
                    <div className="flex flex-col items-center gap-1">
                      {getDisplayIcon() ? (
                        <img 
                          src={getDisplayIcon()!} 
                          alt="App Icon" 
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: formData.pwa_theme_color }}
                        >
                          {getInitials(formData.pwa_app_name || "Restaurant")}
                        </div>
                      )}
                      <span className="text-[10px] text-gray-700 max-w-14 truncate">
                        {formData.pwa_short_name || formData.pwa_app_name?.slice(0, 12) || "App"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Browser Tab Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Monitor className="w-4 h-4" />
                  Browser Tab
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="h-10 flex items-center gap-2 px-3 border-b"
                    style={{ backgroundColor: formData.pwa_theme_color }}
                  >
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-white/20 rounded px-2 py-1 ml-2">
                      {getDisplayIcon() ? (
                        <img src={getDisplayIcon()!} alt="" className="w-4 h-4 rounded" />
                      ) : (
                        <div 
                          className="w-4 h-4 rounded flex items-center justify-center text-white text-[8px] font-bold"
                          style={{ backgroundColor: formData.pwa_theme_color }}
                        >
                          {getInitials(formData.pwa_app_name || "R").charAt(0)}
                        </div>
                      )}
                      <span className="text-white text-xs truncate">
                        {formData.pwa_app_name || "Restaurant"} | Order Online
                      </span>
                    </div>
                  </div>
                  <div className="h-24 bg-gray-50 flex items-center justify-center text-sm text-muted-foreground">
                    Website Content
                  </div>
                </div>
              </div>

              {/* Install Banner Preview */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Install Banner</div>
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    {getDisplayIcon() ? (
                      <img src={getDisplayIcon()!} alt="" className="w-12 h-12 rounded-xl" />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: formData.pwa_theme_color }}
                      >
                        {getInitials(formData.pwa_app_name || "Restaurant")}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{formData.pwa_app_name || "Restaurant"}</p>
                      <p className="text-xs text-muted-foreground">Add to Home Screen</p>
                    </div>
                    <Button size="sm" style={{ backgroundColor: formData.pwa_theme_color }}>
                      Install
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Reset to Defaults
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Reset all PWA settings to use your business name and logo
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (settings) {
                    setFormData({
                      pwa_app_name: settings.site_name || "",
                      pwa_short_name: "",
                      pwa_icon_url: settings.logo_url || "",
                      pwa_favicon_url: settings.logo_url || "",
                      pwa_splash_url: "",
                      pwa_theme_color: settings.primary_color || "#3b82f6",
                      pwa_background_color: "#ffffff"
                    })
                  }
                }}
              >
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
