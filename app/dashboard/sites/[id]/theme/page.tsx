"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Palette, 
  Type, 
  Sun,
  Moon,
  Layout,
  Save,
  Loader2,
  Check,
  RotateCcw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useSWR from "swr"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

const colorPresets = [
  { name: "Ocean Blue", primary: "#0ea5e9", secondary: "#06b6d4" },
  { name: "Forest Green", primary: "#22c55e", secondary: "#10b981" },
  { name: "Royal Purple", primary: "#8b5cf6", secondary: "#a855f7" },
  { name: "Sunset Orange", primary: "#f97316", secondary: "#fb923c" },
  { name: "Rose Pink", primary: "#ec4899", secondary: "#f472b6" },
  { name: "Crimson Red", primary: "#ef4444", secondary: "#f87171" },
  { name: "Golden Yellow", primary: "#eab308", secondary: "#facc15" },
  { name: "Slate Gray", primary: "#64748b", secondary: "#94a3b8" },
]

const fontOptions = [
  { value: "inter", label: "Inter (Modern)" },
  { value: "poppins", label: "Poppins (Friendly)" },
  { value: "roboto", label: "Roboto (Clean)" },
  { value: "playfair", label: "Playfair Display (Elegant)" },
  { value: "montserrat", label: "Montserrat (Bold)" },
  { value: "open-sans", label: "Open Sans (Classic)" },
  { value: "lato", label: "Lato (Smooth)" },
  { value: "raleway", label: "Raleway (Stylish)" },
]

const layoutOptions = [
  { value: "default", label: "Default Layout" },
  { value: "sidebar", label: "Sidebar Navigation" },
  { value: "centered", label: "Centered Content" },
  { value: "fullwidth", label: "Full Width" },
]

interface ThemeSettings {
  primary_color: string
  secondary_color: string
  font_family: string
  dark_mode: boolean
  layout: string
}

export default function ThemeSettingsPage() {
  const params = useParams()
  const siteId = params.id as string

  const { data: siteData, mutate } = useSWR(
    siteId ? `/api/customer/sites/${siteId}` : null,
    fetcher
  )

  const site = siteData?.site
  const siteConfig = site?.site_config || {}

  const [settings, setSettings] = useState<ThemeSettings>({
    primary_color: "#0ea5e9",
    secondary_color: "#06b6d4",
    font_family: "inter",
    dark_mode: true,
    layout: "default",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [customPrimary, setCustomPrimary] = useState("")
  const [customSecondary, setCustomSecondary] = useState("")

  useEffect(() => {
    if (siteConfig) {
      setSettings({
        primary_color: siteConfig.primary_color || "#0ea5e9",
        secondary_color: siteConfig.secondary_color || "#06b6d4",
        font_family: siteConfig.font_family || "inter",
        dark_mode: siteConfig.dark_mode !== false,
        layout: siteConfig.layout || "default",
      })
      setCustomPrimary(siteConfig.primary_color || "#0ea5e9")
      setCustomSecondary(siteConfig.secondary_color || "#06b6d4")
    }
  }, [siteConfig])

  const handleChange = (field: keyof ThemeSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const selectColorPreset = (primary: string, secondary: string) => {
    setSettings(prev => ({ ...prev, primary_color: primary, secondary_color: secondary }))
    setCustomPrimary(primary)
    setCustomSecondary(secondary)
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
            ...settings,
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

  // Autosave after 2 seconds
  useEffect(() => {
    if (!hasChanges) return
    const timer = setTimeout(() => {
      saveSettings()
    }, 2000)
    return () => clearTimeout(timer)
  }, [settings, hasChanges, saveSettings])

  const resetToDefaults = () => {
    setSettings({
      primary_color: "#0ea5e9",
      secondary_color: "#06b6d4",
      font_family: "inter",
      dark_mode: true,
      layout: "default",
    })
    setCustomPrimary("#0ea5e9")
    setCustomSecondary("#06b6d4")
    setHasChanges(true)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Theme Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize the look and feel of your website
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
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

      {/* Color Scheme */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Color Scheme
          </CardTitle>
          <CardDescription>Choose your brand colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Presets */}
          <div>
            <Label className="mb-3 block">Color Presets</Label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => selectColorPreset(preset.primary, preset.secondary)}
                  className={cn(
                    "group relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all",
                    settings.primary_color === preset.primary
                      ? "border-white scale-110 shadow-lg"
                      : "border-transparent hover:border-white/30 hover:scale-105"
                  )}
                  title={preset.name}
                >
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)` 
                    }}
                  />
                  {settings.primary_color === preset.primary && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primary_color"
                  value={customPrimary}
                  onChange={(e) => {
                    setCustomPrimary(e.target.value)
                    handleChange("primary_color", e.target.value)
                  }}
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={customPrimary}
                  onChange={(e) => {
                    setCustomPrimary(e.target.value)
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleChange("primary_color", e.target.value)
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  placeholder="#0ea5e9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="secondary_color"
                  value={customSecondary}
                  onChange={(e) => {
                    setCustomSecondary(e.target.value)
                    handleChange("secondary_color", e.target.value)
                  }}
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={customSecondary}
                  onChange={(e) => {
                    setCustomSecondary(e.target.value)
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleChange("secondary_color", e.target.value)
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  placeholder="#06b6d4"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl border border-border">
            <Label className="mb-3 block text-xs text-muted-foreground">Preview</Label>
            <div className="flex items-center gap-4">
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.secondary_color})` }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium border-2"
                style={{ borderColor: settings.primary_color, color: settings.primary_color }}
              >
                Secondary Button
              </button>
              <span 
                className="text-sm font-medium"
                style={{ color: settings.primary_color }}
              >
                Link Text
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Typography
          </CardTitle>
          <CardDescription>Select your website fonts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font_family">Font Family</Label>
            <Select
              value={settings.font_family}
              onValueChange={(value) => handleChange("font_family", value)}
            >
              <SelectTrigger id="font_family">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dark Mode */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.dark_mode ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
            Theme Mode
          </CardTitle>
          <CardDescription>Choose between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                settings.dark_mode ? "bg-slate-800" : "bg-slate-100"
              )}>
                {settings.dark_mode ? (
                  <Moon className="w-6 h-6 text-white" />
                ) : (
                  <Sun className="w-6 h-6 text-slate-800" />
                )}
              </div>
              <div>
                <p className="font-medium">{settings.dark_mode ? "Dark Mode" : "Light Mode"}</p>
                <p className="text-sm text-muted-foreground">
                  {settings.dark_mode 
                    ? "Dark background with light text" 
                    : "Light background with dark text"}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.dark_mode}
              onCheckedChange={(checked) => handleChange("dark_mode", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            Layout Style
          </CardTitle>
          <CardDescription>Choose your website layout structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="layout">Layout</Label>
            <Select
              value={settings.layout}
              onValueChange={(value) => handleChange("layout", value)}
            >
              <SelectTrigger id="layout">
                <SelectValue placeholder="Select a layout" />
              </SelectTrigger>
              <SelectContent>
                {layoutOptions.map((layout) => (
                  <SelectItem key={layout.value} value={layout.value}>
                    {layout.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
