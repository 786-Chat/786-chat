"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  Key, 
  Shield, 
  Eye, 
  EyeOff, 
  Save, 
  TestTube, 
  CheckCircle, 
  XCircle,
  Loader2,
  DollarSign,
  Globe,
  Percent,
  AlertTriangle
} from "lucide-react"
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

interface StripeSettings {
  stripe_secret_key_masked: string
  stripe_publishable_key: string
  stripe_webhook_secret_masked: string
  stripe_mode: "test" | "live"
  default_currency: string
  vat_enabled: boolean
  vat_rate: number
  is_configured: boolean
}

export default function StripeSettingsPage() {
  const [settings, setSettings] = useState<StripeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  
  // Form fields
  const [secretKey, setSecretKey] = useState("")
  const [publishableKey, setPublishableKey] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [stripeMode, setStripeMode] = useState<"test" | "live">("test")
  const [currency, setCurrency] = useState("GBP")
  const [vatEnabled, setVatEnabled] = useState(false)
  const [vatRate, setVatRate] = useState(20)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/stripe", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setPublishableKey(data.stripe_publishable_key || "")
        setStripeMode(data.stripe_mode || "test")
        setCurrency(data.default_currency || "GBP")
        setVatEnabled(data.vat_enabled || false)
        setVatRate(data.vat_rate || 20)
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setTestResult(null)
    
    try {
      const res = await fetch("/api/admin/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stripe_secret_key: secretKey || undefined,
          stripe_publishable_key: publishableKey || undefined,
          stripe_webhook_secret: webhookSecret || undefined,
          stripe_mode: stripeMode,
          default_currency: currency,
          vat_enabled: vatEnabled,
          vat_rate: vatRate
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        setTestResult({ success: true, message: "Settings saved successfully!" })
        setSecretKey("")
        setWebhookSecret("")
        fetchSettings()
      } else {
        setTestResult({ success: false, message: data.error || "Failed to save settings" })
      }
    } catch {
      setTestResult({ success: false, message: "Network error" })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch("/api/admin/stripe", {
        method: "PUT",
        credentials: "include"
      })

      const data = await res.json()
      setTestResult({ success: data.success, message: data.message })
    } catch {
      setTestResult({ success: false, message: "Failed to test connection" })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Stripe Integration
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure Stripe payment processing for subscriptions and credit top-ups
        </p>
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border ${
          settings?.is_configured 
            ? "bg-green-500/10 border-green-500/30" 
            : "bg-yellow-500/10 border-yellow-500/30"
        }`}
      >
        <div className="flex items-center gap-3">
          {settings?.is_configured ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
          <span className={settings?.is_configured ? "text-green-400" : "text-yellow-400"}>
            {settings?.is_configured 
              ? `Stripe is configured (${settings.stripe_mode} mode)` 
              : "Stripe is not configured yet"}
          </span>
        </div>
      </motion.div>

      {/* API Keys Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass border border-white/10 rounded-2xl p-6 space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">API Keys</h2>
            <p className="text-sm text-muted-foreground">Enter your Stripe API keys</p>
          </div>
        </div>

        {/* Secret Key */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            Secret Key
          </Label>
          <div className="relative">
            <Input
              type={showSecretKey ? "text" : "password"}
              placeholder={settings?.stripe_secret_key_masked || "sk_test_..."}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="bg-background/50 border-white/10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowSecretKey(!showSecretKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {settings?.stripe_secret_key_masked && (
            <p className="text-xs text-muted-foreground">
              Current: {settings.stripe_secret_key_masked} (leave blank to keep)
            </p>
          )}
        </div>

        {/* Publishable Key */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            Publishable Key
          </Label>
          <Input
            type="text"
            placeholder="pk_test_..."
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            className="bg-background/50 border-white/10"
          />
        </div>

        {/* Webhook Secret */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            Webhook Secret
          </Label>
          <div className="relative">
            <Input
              type={showWebhookSecret ? "text" : "password"}
              placeholder={settings?.stripe_webhook_secret_masked || "whsec_..."}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="bg-background/50 border-white/10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {settings?.stripe_webhook_secret_masked && (
            <p className="text-xs text-muted-foreground">
              Current: {settings.stripe_webhook_secret_masked} (leave blank to keep)
            </p>
          )}
        </div>
      </motion.div>

      {/* Configuration Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass border border-white/10 rounded-2xl p-6 space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Configuration</h2>
            <p className="text-sm text-muted-foreground">Payment settings and preferences</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Stripe Mode */}
          <div className="space-y-2">
            <Label>Stripe Mode</Label>
            <Select value={stripeMode} onValueChange={(v) => setStripeMode(v as "test" | "live")}>
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">
                  <span className="flex items-center gap-2">
                    <TestTube className="w-4 h-4 text-yellow-500" />
                    Test Mode
                  </span>
                </SelectItem>
                <SelectItem value="live">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Live Mode
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Currency */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Default Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                <SelectItem value="PKR">₨ PKR - Pakistani Rupee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* VAT Settings */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-400" />
              <Label>Enable VAT/Tax</Label>
            </div>
            <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
          </div>
          
          {vatEnabled && (
            <div className="space-y-2">
              <Label>VAT Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                className="bg-background/50 border-white/10 w-32"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Test Result */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            testResult.success 
              ? "bg-green-500/10 border-green-500/30 text-green-400" 
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{testResult.message}</span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={handleTestConnection}
          disabled={testing || !settings?.is_configured}
          variant="outline"
          className="border-cyan-500/30 hover:bg-cyan-500/10"
        >
          {testing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="w-4 h-4 mr-2" />
          )}
          Test Connection
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Stripe Settings
        </Button>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass border border-white/10 rounded-2xl p-6"
      >
        <h3 className="font-semibold mb-3">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Stripe Dashboard → API Keys</a></li>
          <li>Copy your Secret Key and Publishable Key</li>
          <li>For webhooks, create an endpoint at <code className="bg-white/5 px-2 py-0.5 rounded">/api/stripe/webhook</code></li>
          <li>Select events: <code className="bg-white/5 px-2 py-0.5 rounded">checkout.session.completed</code>, <code className="bg-white/5 px-2 py-0.5 rounded">invoice.paid</code></li>
          <li>Copy the Webhook Secret and paste it here</li>
          <li>Start with Test Mode, then switch to Live when ready</li>
        </ol>
      </motion.div>
    </div>
  )
}
