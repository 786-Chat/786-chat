"use client"

import { useState, useEffect } from "react"
import { useShop } from "../layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Receipt, Loader2, Save } from "lucide-react"

export default function VatPage() {
  const { site } = useShop()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    vat_enabled: true,
    vat_rate: 20,
    vat_number: "",
    prices_include_vat: true,
    service_charge_enabled: false,
    service_charge_rate: 10,
  })

  useEffect(() => {
    if (site?.id) {
      setIsLoading(false)
    }
  }, [site?.id])

  const handleSave = async () => {
    setIsSaving(true)
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
          <h1 className="text-2xl font-bold text-slate-900">VAT & Charges</h1>
          <p className="text-slate-500">Configure tax and service charges</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-orange-500 hover:bg-orange-600">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>VAT Settings</CardTitle>
            <CardDescription>Configure Value Added Tax</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable VAT</Label>
                <p className="text-sm text-slate-500">Apply VAT to orders</p>
              </div>
              <Switch checked={settings.vat_enabled} onCheckedChange={(v) => setSettings({...settings, vat_enabled: v})} />
            </div>
            <div>
              <Label>VAT Rate (%)</Label>
              <Input type="number" value={settings.vat_rate} onChange={(e) => setSettings({...settings, vat_rate: parseFloat(e.target.value)})} />
            </div>
            <div>
              <Label>VAT Number</Label>
              <Input placeholder="GB123456789" value={settings.vat_number} onChange={(e) => setSettings({...settings, vat_number: e.target.value})} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Prices Include VAT</Label>
                <p className="text-sm text-slate-500">Menu prices already include VAT</p>
              </div>
              <Switch checked={settings.prices_include_vat} onCheckedChange={(v) => setSettings({...settings, prices_include_vat: v})} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Charge</CardTitle>
            <CardDescription>Optional service charge settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Service Charge</Label>
                <p className="text-sm text-slate-500">Add service charge to orders</p>
              </div>
              <Switch checked={settings.service_charge_enabled} onCheckedChange={(v) => setSettings({...settings, service_charge_enabled: v})} />
            </div>
            {settings.service_charge_enabled && (
              <div>
                <Label>Service Charge Rate (%)</Label>
                <Input type="number" value={settings.service_charge_rate} onChange={(e) => setSettings({...settings, service_charge_rate: parseFloat(e.target.value)})} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
