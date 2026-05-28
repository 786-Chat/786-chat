"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Truck, MapPin, Save } from "lucide-react"

interface DeliverySettings {
  delivery_enabled: boolean
  collection_enabled: boolean
  delivery_radius_miles: number
  minimum_order_delivery: number
  delivery_charge_enabled: boolean
  delivery_charge_amount: number
  free_delivery_above: number | null
}

export default function DeliverySettingsPage() {
  const params = useParams()
  const siteId = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [radiusType, setRadiusType] = useState<string>("5")
  const [settings, setSettings] = useState<DeliverySettings>({
    delivery_enabled: true,
    collection_enabled: true,
    delivery_radius_miles: 5,
    minimum_order_delivery: 0,
    delivery_charge_enabled: false,
    delivery_charge_amount: 0,
    free_delivery_above: null,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/customer/sites/${siteId}/settings`)
        if (res.ok) {
          const data = await res.json()
          setSettings({
            delivery_enabled: data.delivery_enabled ?? true,
            collection_enabled: data.collection_enabled ?? true,
            delivery_radius_miles: data.delivery_radius_miles ?? 5,
            minimum_order_delivery: data.minimum_order_delivery ?? 0,
            delivery_charge_enabled: data.delivery_charge_enabled ?? false,
            delivery_charge_amount: data.delivery_charge_amount ?? 0,
            free_delivery_above: data.free_delivery_above,
          })
          const radius = data.delivery_radius_miles ?? 5
          if ([3, 4, 5].includes(radius)) {
            setRadiusType(radius.toString())
          } else {
            setRadiusType("custom")
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [siteId])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        alert("Delivery settings saved successfully!")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRadiusChange = (value: string) => {
    setRadiusType(value)
    if (value !== "custom") {
      setSettings({ ...settings, delivery_radius_miles: parseFloat(value) })
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
        <h1 className="text-2xl font-bold">Delivery Settings</h1>
        <p className="text-muted-foreground">Configure delivery and collection options for your customers</p>
      </div>

      <div className="grid gap-6">
        {/* Order Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Order Types
            </CardTitle>
            <CardDescription>Enable or disable delivery and collection options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delivery Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow customers to order for delivery</p>
              </div>
              <Switch
                checked={settings.delivery_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, delivery_enabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Collection Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow customers to collect orders in-store</p>
              </div>
              <Switch
                checked={settings.collection_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, collection_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Radius */}
        {settings.delivery_enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Radius
              </CardTitle>
              <CardDescription>Set how far you deliver from your location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Delivery Radius</Label>
                <Select value={radiusType} onValueChange={handleRadiusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 miles</SelectItem>
                    <SelectItem value="4">4 miles</SelectItem>
                    <SelectItem value="5">5 miles</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {radiusType === "custom" && (
                <div className="space-y-2">
                  <Label>Custom Radius (miles)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={settings.delivery_radius_miles}
                    onChange={(e) => setSettings({ ...settings, delivery_radius_miles: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter radius in miles"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Minimum Order for Delivery</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-7"
                    value={settings.minimum_order_delivery}
                    onChange={(e) => setSettings({ ...settings, minimum_order_delivery: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Set to 0 for no minimum order</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Charges */}
        {settings.delivery_enabled && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Charges</CardTitle>
              <CardDescription>Configure delivery fees for orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Charge for Delivery</Label>
                  <p className="text-sm text-muted-foreground">Add a delivery charge to orders</p>
                </div>
                <Switch
                  checked={settings.delivery_charge_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, delivery_charge_enabled: checked })}
                />
              </div>
              {settings.delivery_charge_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Delivery Charge Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        value={settings.delivery_charge_amount}
                        onChange={(e) => setSettings({ ...settings, delivery_charge_amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Free Delivery Above (Optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        value={settings.free_delivery_above || ""}
                        onChange={(e) => setSettings({ ...settings, free_delivery_above: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="Leave empty to disable"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Orders above this amount get free delivery</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
