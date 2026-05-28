"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Receipt, Save } from "lucide-react"

interface VatSettings {
  vat_enabled: boolean
  vat_percentage: number
  show_vat_on_invoice: boolean
  prices_include_vat: boolean
  tax_name: string
}

export default function VatTaxSettingsPage() {
  const params = useParams()
  const siteId = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<VatSettings>({
    vat_enabled: false,
    vat_percentage: 20,
    show_vat_on_invoice: true,
    prices_include_vat: true,
    tax_name: "VAT",
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/customer/sites/${siteId}/settings`)
        if (res.ok) {
          const data = await res.json()
          setSettings({
            vat_enabled: data.vat_enabled ?? false,
            vat_percentage: data.vat_percentage ?? 20,
            show_vat_on_invoice: data.show_vat_on_invoice ?? true,
            prices_include_vat: data.prices_include_vat ?? true,
            tax_name: data.tax_name || "VAT",
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
        alert("VAT & Tax settings saved successfully!")
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
        <h1 className="text-2xl font-bold">VAT & Tax Settings</h1>
        <p className="text-muted-foreground">Configure VAT and tax settings for your orders and invoices</p>
      </div>

      <div className="grid gap-6">
        {/* VAT Enable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Tax Configuration
            </CardTitle>
            <CardDescription>Enable and configure tax settings for your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable VAT/Tax</Label>
                <p className="text-sm text-muted-foreground">Apply tax calculations to orders</p>
              </div>
              <Switch
                checked={settings.vat_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, vat_enabled: checked })}
              />
            </div>

            {settings.vat_enabled && (
              <>
                <div className="space-y-2">
                  <Label>Tax Name</Label>
                  <Input
                    value={settings.tax_name}
                    onChange={(e) => setSettings({ ...settings, tax_name: e.target.value })}
                    placeholder="VAT, Sales Tax, GST..."
                  />
                  <p className="text-xs text-muted-foreground">This name will appear on invoices and receipts</p>
                </div>

                <div className="space-y-2">
                  <Label>Tax Percentage (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.vat_percentage}
                      onChange={(e) => setSettings({ ...settings, vat_percentage: parseFloat(e.target.value) || 0 })}
                      placeholder="20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Standard UK VAT is 20%</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        {settings.vat_enabled && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice & Pricing Settings</CardTitle>
              <CardDescription>Configure how tax is displayed and calculated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show {settings.tax_name} on Invoice</Label>
                  <p className="text-sm text-muted-foreground">Display tax breakdown on customer invoices and receipts</p>
                </div>
                <Switch
                  checked={settings.show_vat_on_invoice}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_vat_on_invoice: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Prices Include {settings.tax_name}</Label>
                  <p className="text-sm text-muted-foreground">Menu prices already include tax (recommended for B2C)</p>
                </div>
                <Switch
                  checked={settings.prices_include_vat}
                  onCheckedChange={(checked) => setSettings({ ...settings, prices_include_vat: checked })}
                />
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-3">Invoice Preview:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>£10.00</span>
                  </div>
                  {settings.show_vat_on_invoice && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{settings.tax_name} ({settings.vat_percentage}%)</span>
                      <span>
                        {settings.prices_include_vat 
                          ? `(Included: £${(10 * settings.vat_percentage / (100 + settings.vat_percentage)).toFixed(2)})`
                          : `£${(10 * settings.vat_percentage / 100).toFixed(2)}`
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total</span>
                    <span>
                      £{settings.prices_include_vat 
                        ? "10.00" 
                        : (10 * (1 + settings.vat_percentage / 100)).toFixed(2)
                      }
                    </span>
                  </div>
                </div>
              </div>
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
