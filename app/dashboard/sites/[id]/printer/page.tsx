"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { 
  Printer, 
  Save,
  DollarSign,
  TestTube,
  Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import useSWR from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

export default function PrinterSettingsPage() {
  const params = useParams()
  const siteId = params.id as string
  
  const { data, mutate } = useSWR(
    `/api/customer/sites/${siteId}/settings`,
    fetcher
  )

  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    receipt_printer_name: "",
    kitchen_printer_name: "",
    paper_size: "80mm",
    auto_print_kitchen_ticket: true,
    auto_print_receipt: false,
    enable_cash_drawer: false,
    show_logo_on_receipt: true,
    show_qr_code: false,
    receipt_footer_text: "Thank you for your order!",
  })

  // Initialize settings when data loads
  useState(() => {
    if (data?.settings?.printer_settings) {
      setSettings(prev => ({ ...prev, ...data.settings.printer_settings }))
    }
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          printer_settings: settings,
        }),
      })
      
      if (!res.ok) throw new Error("Failed to save")
      
      toast.success("Printer settings saved successfully")
      mutate()
    } catch {
      toast.error("Failed to save printer settings")
    } finally {
      setSaving(false)
    }
  }

  const testPrint = (type: "receipt" | "kitchen") => {
    toast.info(`Test ${type} print sent to printer`)
    // In real implementation, this would call window.print() or a print API
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Printer Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure receipt and kitchen ticket printing
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Printing requires a compatible thermal printer connected to your device. 
          For cash drawer functionality, your printer must support ESC/POS commands.
        </AlertDescription>
      </Alert>

      {/* Receipt Printer Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Receipt Printer
          </CardTitle>
          <CardDescription>
            Configure the printer used for customer receipts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receipt_printer">Printer Name</Label>
              <Input
                id="receipt_printer"
                value={settings.receipt_printer_name}
                onChange={(e) => setSettings(prev => ({ ...prev, receipt_printer_name: e.target.value }))}
                placeholder="e.g., EPSON TM-T88VI"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use system default printer
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paper_size">Paper Size</Label>
              <Select 
                value={settings.paper_size} 
                onValueChange={(v) => setSettings(prev => ({ ...prev, paper_size: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (Narrow)</SelectItem>
                  <SelectItem value="80mm">80mm (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-print Receipt</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically print receipt when order is marked ready
                </p>
              </div>
              <Switch
                checked={settings.auto_print_receipt}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, auto_print_receipt: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Logo on Receipt</Label>
                <p className="text-xs text-muted-foreground">
                  Print your business logo at the top of receipts
                </p>
              </div>
              <Switch
                checked={settings.show_logo_on_receipt}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, show_logo_on_receipt: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show QR Code</Label>
                <p className="text-xs text-muted-foreground">
                  Add QR code linking to your website
                </p>
              </div>
              <Switch
                checked={settings.show_qr_code}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, show_qr_code: v }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_text">Receipt Footer Text</Label>
            <Input
              id="footer_text"
              value={settings.receipt_footer_text}
              onChange={(e) => setSettings(prev => ({ ...prev, receipt_footer_text: e.target.value }))}
              placeholder="Thank you for your order!"
            />
          </div>

          <Button variant="outline" size="sm" onClick={() => testPrint("receipt")}>
            <TestTube className="w-4 h-4 mr-2" />
            Test Print Receipt
          </Button>
        </CardContent>
      </Card>

      {/* Kitchen Printer Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Kitchen Printer
          </CardTitle>
          <CardDescription>
            Configure the printer used for kitchen tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kitchen_printer">Printer Name</Label>
            <Input
              id="kitchen_printer"
              value={settings.kitchen_printer_name}
              onChange={(e) => setSettings(prev => ({ ...prev, kitchen_printer_name: e.target.value }))}
              placeholder="e.g., Kitchen Printer"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the same printer as receipts
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div>
              <Label>Auto-print Kitchen Ticket</Label>
              <p className="text-xs text-muted-foreground">
                Automatically print kitchen ticket when order is accepted
              </p>
            </div>
            <Switch
              checked={settings.auto_print_kitchen_ticket}
              onCheckedChange={(v) => setSettings(prev => ({ ...prev, auto_print_kitchen_ticket: v }))}
            />
          </div>

          <Button variant="outline" size="sm" onClick={() => testPrint("kitchen")}>
            <TestTube className="w-4 h-4 mr-2" />
            Test Print Kitchen Ticket
          </Button>
        </CardContent>
      </Card>

      {/* Cash Drawer Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cash Drawer
          </CardTitle>
          <CardDescription>
            Configure cash drawer trigger for cash payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <Info className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              Cash drawer requires compatible thermal printer/till hardware with ESC/POS support.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Cash Drawer</Label>
              <p className="text-xs text-muted-foreground">
                Open cash drawer when cash payment is completed
              </p>
            </div>
            <Switch
              checked={settings.enable_cash_drawer}
              onCheckedChange={(v) => setSettings(prev => ({ ...prev, enable_cash_drawer: v }))}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Cash drawer will trigger when:
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li>Cash payment is selected</li>
            <li>Manager clicks &quot;Complete Payment&quot;</li>
            <li>Manager clicks &quot;Print Receipt&quot; for cash orders</li>
          </ul>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
