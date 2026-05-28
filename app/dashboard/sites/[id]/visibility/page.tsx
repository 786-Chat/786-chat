"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Globe, Store, Eye, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

const categories = [
  "Restaurant",
  "Pizza", 
  "Chicken",
  "Cafe",
  "Dessert",
  "Grocery",
  "Indian",
  "Chinese",
  "Thai",
  "Italian",
  "Mexican",
  "Japanese",
  "Bakery",
  "Fast Food"
]

const radiusOptions = [
  { value: "1", label: "1 mile" },
  { value: "3", label: "3 miles" },
  { value: "5", label: "5 miles" },
  { value: "10", label: "10 miles" },
  { value: "15", label: "15 miles" },
  { value: "custom", label: "Custom" }
]

export default function VisibilitySettingsPage() {
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    visibility_mode: "own_website",
    show_in_marketplace: false,
    marketplace_approved: false,
    marketplace_featured: false,
    marketplace_category: "",
    delivery_radius_miles: "5",
    estimated_delivery_minutes: "30",
    marketplace_description: "",
    is_open: true
  })
  const [customRadius, setCustomRadius] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [params.id])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/customer/sites/${params.id}/visibility`)
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings({
            visibility_mode: data.settings.visibility_mode || "own_website",
            show_in_marketplace: data.settings.show_in_marketplace || false,
            marketplace_approved: data.settings.marketplace_approved || false,
            marketplace_featured: data.settings.marketplace_featured || false,
            marketplace_category: data.settings.marketplace_category || "",
            delivery_radius_miles: String(data.settings.delivery_radius_miles || 5),
            estimated_delivery_minutes: String(data.settings.estimated_delivery_minutes || 30),
            marketplace_description: data.settings.marketplace_description || "",
            is_open: data.settings.is_open !== false
          })
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const radiusValue = settings.delivery_radius_miles === "custom" 
        ? customRadius 
        : settings.delivery_radius_miles

      const res = await fetch(`/api/customer/sites/${params.id}/visibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          delivery_radius_miles: parseFloat(radiusValue) || 5,
          estimated_delivery_minutes: parseInt(settings.estimated_delivery_minutes) || 30
        })
      })

      if (res.ok) {
        toast.success("Visibility settings saved!")
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visibility Settings</h1>
        <p className="text-muted-foreground">
          Control where your restaurant appears - your own website, the marketplace, or both.
        </p>
      </div>

      {/* Approval Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Marketplace Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {settings.marketplace_approved ? (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Approved for Marketplace
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                <AlertCircle className="w-3 h-3 mr-1" />
                Pending Approval
              </Badge>
            )}
            {settings.marketplace_featured && (
              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                Featured Restaurant
              </Badge>
            )}
          </div>
          {!settings.marketplace_approved && (
            <p className="text-sm text-muted-foreground mt-2">
              Your restaurant needs admin approval before it can appear in the marketplace.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Visibility Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Where do you want to be visible?</CardTitle>
          <CardDescription>
            Choose how customers can find your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={settings.visibility_mode}
            onValueChange={(value) => setSettings({ ...settings, visibility_mode: value })}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="own_website" id="own_website" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="own_website" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Own Website Only</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Your restaurant is only visible on your custom domain or subdomain.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="marketplace_only" id="marketplace_only" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="marketplace_only" className="flex items-center gap-2 cursor-pointer">
                  <Store className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Marketplace Only</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Your restaurant only appears in the MujeebProAI food marketplace.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="both" id="both" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Both Website & Marketplace</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum visibility - appear on your own website and in the marketplace.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Marketplace Settings */}
      {(settings.visibility_mode === "marketplace_only" || settings.visibility_mode === "both") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Marketplace Settings
            </CardTitle>
            <CardDescription>
              Configure how your restaurant appears in the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Open/Closed Status */}
            <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
              <div>
                <Label className="font-medium">Currently Open</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle this to show if you are accepting orders
                </p>
              </div>
              <Switch
                checked={settings.is_open}
                onCheckedChange={(checked) => setSettings({ ...settings, is_open: checked })}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Restaurant Category</Label>
              <Select
                value={settings.marketplace_category}
                onValueChange={(value) => setSettings({ ...settings, marketplace_category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Radius */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Radius
              </Label>
              <Select
                value={settings.delivery_radius_miles}
                onValueChange={(value) => setSettings({ ...settings, delivery_radius_miles: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {radiusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {settings.delivery_radius_miles === "custom" && (
                <Input
                  type="number"
                  placeholder="Enter custom radius in miles"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Estimated Delivery Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Estimated Delivery Time (minutes)
              </Label>
              <Input
                type="number"
                value={settings.estimated_delivery_minutes}
                onChange={(e) => setSettings({ ...settings, estimated_delivery_minutes: e.target.value })}
                placeholder="30"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Marketplace Description</Label>
              <Textarea
                value={settings.marketplace_description}
                onChange={(e) => setSettings({ ...settings, marketplace_description: e.target.value })}
                placeholder="A short description of your restaurant for the marketplace..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Visibility Settings
        </Button>
      </div>
    </div>
  )
}
