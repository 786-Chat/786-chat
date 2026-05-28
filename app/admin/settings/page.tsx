"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Settings, 
  Save, 
  Shield, 
  Database, 
  Bell, 
  Loader2,
  Cpu,
  DollarSign,
  AlertTriangle,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UsageData {
  spending?: {
    today?: { costGbp: number; messages: number }
    month?: { costGbp: number; messages: number }
    total?: { costGbp: number; messages: number }
  }
  budgetStatus?: {
    warning: boolean
    exceeded: boolean
    todayCostGbp: number
    warningThreshold: number
    hardLimit: number
  }
  activeUsersLast24h?: number
  blockedUsers?: Array<{ user_id: string; email: string; name: string; block_reason: string }>
}

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [settings, setSettings] = useState({
    siteName: "MujeebProAI",
    supportEmail: "support@mujeebproai.com",
    maintenanceMode: false,
    newUserRegistration: true,
    emailVerificationRequired: false,
    maxFreeMessages: 5,
    // AI Budget settings
    aiWarningLimitGBP: 50,
    aiHardLimitGBP: 100,
    perUserDailyLimit: 50,
    monthlyPlanLimits: {
      starter: 10,
      basic: 100,
      pro: 500,
      business: 2000,
      enterprise: 10000
    }
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/usage?view=dashboard", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setUsageData(data)
        }
      } catch (error) {
        console.error("Failed to fetch usage data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure system-wide settings and AI budget controls
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700">
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* AI Budget Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`border ${usageData?.budgetStatus?.exceeded ? 'border-red-500 bg-red-500/10' : usageData?.budgetStatus?.warning ? 'border-yellow-500 bg-yellow-500/10' : 'border-green-500/20 bg-green-500/5'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {usageData?.budgetStatus?.exceeded ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : usageData?.budgetStatus?.warning ? (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-500" />
              )}
              AI Budget Status
            </CardTitle>
            <CardDescription>
              {usageData?.budgetStatus?.exceeded 
                ? "Budget exceeded! AI features may be limited."
                : usageData?.budgetStatus?.warning 
                  ? "Warning: Approaching budget limit"
                  : "Budget healthy - all systems operational"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground">Today Spend</p>
                  <p className="text-2xl font-bold">£{usageData?.spending?.today?.costGbp?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground">Month Spend</p>
                  <p className="text-2xl font-bold">£{usageData?.spending?.month?.costGbp?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                  <p className="text-2xl font-bold">£{usageData?.spending?.total?.costGbp?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground">Active Users (24h)</p>
                  <p className="text-2xl font-bold">{usageData?.activeUsersLast24h || 0}</p>
                </div>
              </div>
            )}
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-400">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Claude API balance cannot be fetched directly from Anthropic API. 
                Showing estimated spend from usage logs.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Budget Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">AI Budget Controls</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiWarningLimit">Warning Limit (GBP)</Label>
              <Input
                id="aiWarningLimit"
                type="number"
                value={settings.aiWarningLimitGBP}
                onChange={(e) => setSettings({ ...settings, aiWarningLimitGBP: parseInt(e.target.value) || 50 })}
                className="mt-1 bg-background/50 border-white/10"
              />
              <p className="text-xs text-muted-foreground mt-1">Alert when daily spend exceeds this</p>
            </div>
            <div>
              <Label htmlFor="aiHardLimit">Hard Stop Limit (GBP)</Label>
              <Input
                id="aiHardLimit"
                type="number"
                value={settings.aiHardLimitGBP}
                onChange={(e) => setSettings({ ...settings, aiHardLimitGBP: parseInt(e.target.value) || 100 })}
                className="mt-1 bg-background/50 border-white/10"
              />
              <p className="text-xs text-muted-foreground mt-1">Stop AI features when daily spend exceeds this</p>
            </div>
            <div>
              <Label htmlFor="perUserDailyLimit">Per-User Daily Limit</Label>
              <Input
                id="perUserDailyLimit"
                type="number"
                value={settings.perUserDailyLimit}
                onChange={(e) => setSettings({ ...settings, perUserDailyLimit: parseInt(e.target.value) || 50 })}
                className="mt-1 bg-background/50 border-white/10"
              />
              <p className="text-xs text-muted-foreground mt-1">Max messages per user per day</p>
            </div>
          </div>
        </motion.div>

        {/* Monthly Plan Limits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Monthly Plan Limits</h2>
          </div>
          
          <div className="space-y-4">
            {Object.entries(settings.monthlyPlanLimits).map(([plan, limit]) => (
              <div key={plan}>
                <Label htmlFor={`limit-${plan}`} className="capitalize">{plan} Plan</Label>
                <Input
                  id={`limit-${plan}`}
                  type="number"
                  value={limit}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    monthlyPlanLimits: {
                      ...settings.monthlyPlanLimits,
                      [plan]: parseInt(e.target.value) || 0
                    }
                  })}
                  className="mt-1 bg-background/50 border-white/10"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="mt-1 bg-background/50 border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="mt-1 bg-background/50 border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="maxFreeMessages">Max Free Messages</Label>
              <Input
                id="maxFreeMessages"
                type="number"
                value={settings.maxFreeMessages}
                onChange={(e) => setSettings({ ...settings, maxFreeMessages: parseInt(e.target.value) || 5 })}
                className="mt-1 bg-background/50 border-white/10"
              />
            </div>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Security Settings</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">Disable access for non-admins</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">New User Registration</p>
                <p className="text-sm text-muted-foreground">Allow new users to register</p>
              </div>
              <Switch
                checked={settings.newUserRegistration}
                onCheckedChange={(checked) => setSettings({ ...settings, newUserRegistration: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Email Verification</p>
                <p className="text-sm text-muted-foreground">Require email verification</p>
              </div>
              <Switch
                checked={settings.emailVerificationRequired}
                onCheckedChange={(checked) => setSettings({ ...settings, emailVerificationRequired: checked })}
              />
            </div>
          </div>
        </motion.div>

        {/* Blocked Users */}
        {usageData?.blockedUsers && usageData.blockedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-xl border border-red-500/20 p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-white">Blocked Users ({usageData.blockedUsers.length})</h2>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {usageData.blockedUsers.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div>
                    <p className="font-medium text-white">{user.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-400">{user.block_reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl border border-white/10 p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="font-medium text-white">Budget Warning Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when approaching limits</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="font-medium text-white">Payment Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified for new payments</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="font-medium text-white">Error Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified for system errors</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="font-medium text-white">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">Receive weekly analytics reports</p>
              </div>
              <Switch />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
