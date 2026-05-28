"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { 
  CreditCard, 
  Banknote,
  Smartphone,
  QrCode,
  Save,
  Loader2,
  Check
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

interface PaymentSettings {
  cash: boolean
  bank_transfer: boolean
  card: boolean
  apple_pay: boolean
  google_pay: boolean
  qr_barcode: boolean
  bank_name?: string
  account_number?: string
  sort_code?: string
  account_name?: string
}

const paymentMethods = [
  { key: "cash", label: "Cash", icon: Banknote, description: "Accept cash payments in person" },
  { key: "bank_transfer", label: "Bank Transfer", icon: CreditCard, description: "Customers can pay via bank transfer" },
  { key: "card", label: "Card Payments", icon: CreditCard, description: "Accept debit and credit cards" },
  { key: "apple_pay", label: "Apple Pay", icon: Smartphone, description: "Accept Apple Pay payments" },
  { key: "google_pay", label: "Google Pay", icon: Smartphone, description: "Accept Google Pay payments" },
  { key: "qr_barcode", label: "QR / Barcode", icon: QrCode, description: "Generate payment QR codes" },
]

export default function PaymentsPage() {
  const params = useParams()
  const siteId = params.id as string

  const { data: settingsData, mutate } = useSWR(
    siteId ? `/api/customer/sites/${siteId}/settings` : null,
    fetcher
  )

  const [settings, setSettings] = useState<PaymentSettings>({
    cash: true,
    bank_transfer: false,
    card: false,
    apple_pay: false,
    google_pay: false,
    qr_barcode: false,
    bank_name: "",
    account_number: "",
    sort_code: "",
    account_name: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (settingsData?.settings?.payment_methods) {
      const pm = settingsData.settings.payment_methods
      setSettings({
        cash: pm.cash ?? true,
        bank_transfer: pm.bank_transfer ?? false,
        card: pm.card ?? false,
        apple_pay: pm.apple_pay ?? false,
        google_pay: pm.google_pay ?? false,
        qr_barcode: pm.qr_barcode ?? false,
        bank_name: pm.bank_name || "",
        account_number: pm.account_number || "",
        sort_code: pm.sort_code || "",
        account_name: pm.account_name || "",
      })
    }
  }, [settingsData])

  const handleToggle = (key: keyof PaymentSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = useCallback(async () => {
    if (!hasChanges) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          payment_methods: settings,
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
  }, [settings, hasChanges, siteId, mutate])

  // Autosave
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
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground mt-1">
            Configure how customers can pay you
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Saved
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

      {/* Payment Methods */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Options
          </CardTitle>
          <CardDescription>Enable the payment methods you accept</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.key}
              className="flex items-center justify-between p-4 rounded-lg border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <method.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{method.label}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[method.key as keyof PaymentSettings] as boolean}
                onCheckedChange={(checked) => handleToggle(method.key as keyof PaymentSettings, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bank Details (if bank transfer enabled) */}
      {settings.bank_transfer && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Bank Transfer Details</CardTitle>
            <CardDescription>These details will be shown to customers for bank transfers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={settings.bank_name}
                  onChange={(e) => handleToggle("bank_name", e.target.value)}
                  placeholder="e.g., Barclays"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={settings.account_name}
                  onChange={(e) => handleToggle("account_name", e.target.value)}
                  placeholder="Account holder name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_code">Sort Code</Label>
                <Input
                  id="sort_code"
                  value={settings.sort_code}
                  onChange={(e) => handleToggle("sort_code", e.target.value)}
                  placeholder="00-00-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={settings.account_number}
                  onChange={(e) => handleToggle("account_number", e.target.value)}
                  placeholder="12345678"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
