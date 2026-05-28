"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Percent, Save } from "lucide-react"

interface ChargesSettings {
  service_charge_enabled: boolean
  service_charge_type: "percentage" | "fixed"
  service_charge_amount: number
  show_service_charge_on_invoice: boolean
}

export default function ChargesSettingsPage() {
  const params = useParams()
  const siteId = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<ChargesSettings>({
    service_charge_enabled: false,
    service_charge_type: "percentage",
    service_charge_amount: 0,
    show_service_charge_on_invoice: true,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/customer/sites/${siteId}/settings`)
        if (res.ok) {
          const data = await res.json()
          setSettings({
            service_charge_enabled: data.service_charge_enabled ?? false,
            service_charge_type: data.service_charge_type || "percentage",
            service_charge_amount: data.service_charge_amount ?? 0,
            show_service_charge_on_invoice: data.show_service_charge_on_invoice ?? true,
          })
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
        alert("Charges settings saved successfully!")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
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
        <h1 className="text-2xl font-bold">Charges Settings</h1>
        <p className="text-muted-foreground">Configure service charges for your orders</p>
      </div>

      <div className="grid gap-6">
        {/* Service Charge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Service Charge
            </CardTitle>
            <CardDescription>Add an optional service charge to orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Service Charge</Label>
                <p className="text-sm text-muted-foreground">Apply a service charge to all orders</p>
              </div>
              <Switch
                checked={settings.service_charge_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, service_charge_enabled: checked })}
              />
            </div>

            {settings.service_charge_enabled && (
              <>
                <div className="space-y-2">
                  <Label>Charge Type</Label>
                  <Select 
                    value={settings.service_charge_type} 
                    onValueChange={(value: "percentage" | "fixed") => setSettings({ ...settings, service_charge_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage of order total</SelectItem>
                      <SelectItem value="fixed">Fixed amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    {settings.service_charge_type === "percentage" ? "Service Charge Percentage" : "Service Charge Amount"}
                  </Label>
                  <div className="relative">
                    {settings.service_charge_type === "fixed" && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={settings.service_charge_type === "percentage" ? "100" : undefined}
                      className={settings.service_charge_type === "fixed" ? "pl-7" : ""}
                      value={settings.service_charge_amount}
                      onChange={(e) => setSettings({ ...settings, service_charge_amount: parseFloat(e.target.value) || 0 })}
                      placeholder={settings.service_charge_type === "percentage" ? "10" : "1.50"}
                    />
                    {settings.service_charge_type === "percentage" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {settings.service_charge_type === "percentage" 
                      ? "Percentage added to order subtotal"
                      : "Fixed amount added to each order"
                    }
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show on Invoice</Label>
                    <p className="text-sm text-muted-foreground">Display service charge separately on receipts</p>
                  </div>
                  <Switch
                    checked={settings.show_service_charge_on_invoice}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_service_charge_on_invoice: checked })}
                  />
                </div>

                {/* Preview */}
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-3">Invoice Preview (£20.00 order):</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>£20.00</span>
                    </div>
                    {settings.show_service_charge_on_invoice && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Service Charge {settings.service_charge_type === "percentage" ? `(${settings.service_charge_amount}%)` : ""}</span>
                        <span>
                          £{settings.service_charge_type === "percentage" 
                            ? (20 * settings.service_charge_amount / 100).toFixed(2)
                            : settings.service_charge_amount.toFixed(2)
                          }
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total</span>
                      <span>
                        £{settings.service_charge_type === "percentage" 
                          ? (20 * (1 + settings.service_charge_amount / 100)).toFixed(2)
                          : (20 + settings.service_charge_amount).toFixed(2)
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
