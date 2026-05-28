"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Store, 
  Clock, 
  Truck, 
  CreditCard,
  Save
} from "lucide-react"
import { toast } from "sonner"

interface Settings {
  business_name: string
  owner_name: string
  email: string
  phone: string
  whatsapp: string
  address: string
  is_open: boolean
  delivery_enabled: boolean
  collection_enabled: boolean
  delivery_charge_enabled: boolean
  delivery_charge_amount: number
  minimum_order_delivery: number
  estimated_delivery_minutes: number
  vat_enabled: boolean
  vat_percentage: number
}

export default function ShopSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/shop/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/shop/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        toast.success("Settings saved successfully")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your restaurant settings</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business" className="gap-2">
            <Store className="w-4 h-4" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="delivery" className="gap-2">
            <Truck className="w-4 h-4" />
            Delivery
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="w-4 h-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Business Info */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Basic information about your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Name</Label>
                  <Input
                    value={settings.business_name || ""}
                    onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Owner Name</Label>
                  <Input
                    value={settings.owner_name || ""}
                    onChange={(e) => setSettings({ ...settings, owner_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={settings.email || ""}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={settings.phone || ""}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={settings.whatsapp || ""}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={settings.address || ""}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Settings */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Settings</CardTitle>
              <CardDescription>Configure delivery and collection options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Delivery</p>
                  <p className="text-sm text-muted-foreground">Allow customers to order for delivery</p>
                </div>
                <Switch
                  checked={settings.delivery_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, delivery_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Collection</p>
                  <p className="text-sm text-muted-foreground">Allow customers to collect orders</p>
                </div>
                <Switch
                  checked={settings.collection_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, collection_enabled: checked })}
                />
              </div>
              
              {settings.delivery_enabled && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">Delivery Charge</p>
                        <p className="text-sm text-muted-foreground">Charge customers for delivery</p>
                      </div>
                      <Switch
                        checked={settings.delivery_charge_enabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, delivery_charge_enabled: checked })}
                      />
                    </div>
                    {settings.delivery_charge_enabled && (
                      <div>
                        <Label>Delivery Charge Amount (GBP)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(settings.delivery_charge_amount / 100).toFixed(2)}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            delivery_charge_amount: Math.round(parseFloat(e.target.value) * 100) 
                          })}
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Order for Delivery (GBP)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(settings.minimum_order_delivery / 100).toFixed(2)}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          minimum_order_delivery: Math.round(parseFloat(e.target.value) * 100) 
                        })}
                      />
                    </div>
                    <div>
                      <Label>Estimated Delivery Time (minutes)</Label>
                      <Input
                        type="number"
                        value={settings.estimated_delivery_minutes || 30}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          estimated_delivery_minutes: parseInt(e.target.value) 
                        })}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Status</CardTitle>
              <CardDescription>Control if your restaurant is accepting orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-lg">Restaurant Status</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.is_open 
                      ? "Your restaurant is currently accepting orders" 
                      : "Your restaurant is closed and not accepting orders"}
                  </p>
                </div>
                <Switch
                  checked={settings.is_open}
                  onCheckedChange={(checked) => setSettings({ ...settings, is_open: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment & Tax Settings</CardTitle>
              <CardDescription>Configure VAT and payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable VAT</p>
                  <p className="text-sm text-muted-foreground">Add VAT to order totals</p>
                </div>
                <Switch
                  checked={settings.vat_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, vat_enabled: checked })}
                />
              </div>
              {settings.vat_enabled && (
                <div>
                  <Label>VAT Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.vat_percentage || 20}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      vat_percentage: parseFloat(e.target.value) 
                    })}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
