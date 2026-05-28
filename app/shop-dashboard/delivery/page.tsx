"use client"

import { useState, useEffect } from "react"
import { useShop } from "../layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Truck, Loader2, Save, MapPin, Plus } from "lucide-react"

export default function DeliveryPage() {
  const { site } = useShop()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    delivery_enabled: true,
    collection_enabled: true,
    delivery_charge: 2.99,
    free_delivery_threshold: 20,
    min_order_delivery: 10,
    min_order_collection: 5,
    delivery_radius: 5,
  })

  useEffect(() => {
    if (site?.id) {
      setIsLoading(false)
    }
  }, [site?.id])

  const handleSave = async () => {
    setIsSaving(true)
    // Save settings
    setTimeout(() => setIsSaving(false), 1000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Settings</h1>
          <p className="text-slate-500">Configure delivery and collection options</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-orange-500 hover:bg-orange-600">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Types</CardTitle>
            <CardDescription>Enable or disable order types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Delivery</Label>
                <p className="text-sm text-slate-500">Allow customers to order delivery</p>
              </div>
              <Switch checked={settings.delivery_enabled} onCheckedChange={(v) => setSettings({...settings, delivery_enabled: v})} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Collection</Label>
                <p className="text-sm text-slate-500">Allow customers to collect orders</p>
              </div>
              <Switch checked={settings.collection_enabled} onCheckedChange={(v) => setSettings({...settings, collection_enabled: v})} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Charges</CardTitle>
            <CardDescription>Set delivery fees and thresholds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Delivery Charge (£)</Label>
              <Input type="number" step="0.01" value={settings.delivery_charge} onChange={(e) => setSettings({...settings, delivery_charge: parseFloat(e.target.value)})} />
            </div>
            <div>
              <Label>Free Delivery Over (£)</Label>
              <Input type="number" step="0.01" value={settings.free_delivery_threshold} onChange={(e) => setSettings({...settings, free_delivery_threshold: parseFloat(e.target.value)})} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minimum Orders</CardTitle>
            <CardDescription>Set minimum order amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Min Order for Delivery (£)</Label>
              <Input type="number" step="0.01" value={settings.min_order_delivery} onChange={(e) => setSettings({...settings, min_order_delivery: parseFloat(e.target.value)})} />
            </div>
            <div>
              <Label>Min Order for Collection (£)</Label>
              <Input type="number" step="0.01" value={settings.min_order_collection} onChange={(e) => setSettings({...settings, min_order_collection: parseFloat(e.target.value)})} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Zones</CardTitle>
            <CardDescription>Manage your delivery areas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2">
              <MapPin className="w-4 h-4" />
              Manage Delivery Zones
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
