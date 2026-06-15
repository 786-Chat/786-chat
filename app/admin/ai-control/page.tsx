"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Bot, 
  Save, 
  DollarSign, 
  Users, 
  MessageSquare, 
  Zap,
  AlertTriangle,
  TrendingUp,
  Clock,
  Key,
  Settings,
  RefreshCw,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"

interface AISettings {
  id: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  dailyMessageLimit: number
  monthlyTokenLimit: number
  autoBlockOnLimit: boolean
  monthlyBudgetUsd: number
  budgetAlertThreshold: number
  isActive: boolean
}

interface CostSummary {
  today: { cost: number; messages: number; tokens: number }
  thisMonth: { cost: number; messages: number; tokens: number }
  budget: { limit: number; used: number; percentage: number; alert: boolean }
}

interface UserCost {
  userId: string
  userName: string
  userEmail: string
  todayCost: number
  monthCost: number
  todayMessages: number
  monthMessages: number
}

export default function AIControlPage() {
  const [settings, setSettings] = useState<AISettings | null>(null)
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null)
  const [userCosts, setUserCosts] = useState<UserCost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [settingsRes, costRes, usersRes] = await Promise.all([
        fetch("/api/admin/ai-control/settings"),
        fetch("/api/admin/ai-control/costs"),
        fetch("/api/admin/ai-control/user-costs")
      ])

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
        setHasApiKey(data.hasApiKey)
      }
      if (costRes.ok) {
        setCostSummary(await costRes.json())
      }
      if (usersRes.ok) {
        setUserCosts(await usersRes.json())
      }
    } catch (error) {
      console.error("Failed to fetch AI control data:", error)
      toast.error("Failed to load AI settings")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/ai-control/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        toast.success("AI settings saved successfully")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (error) {
      toast.error("Error saving settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
            <Bot className="w-7 h-7 text-cyan-400" />
            AI Control Center
          </h1>
          <p className="text-white/60 mt-1 overflow-hidden text-ellipsis whitespace-nowrap">Manage your MujeebProAI settings, limits, and costs</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="flex-shrink-0">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* API Key Status */}
      <Card className="bg-[#14141f] border-white/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-white font-medium">DeepSeek API Key</p>
                <p className="text-sm text-white/50">Required for AI functionality</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasApiKey ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Not Set
                </Badge>
              )}
              <Button variant="outline" size="sm" asChild>
                <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">
                  Get API Key
                </a>
              </Button>
            </div>
          </div>
          {!hasApiKey && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300">
                Add your DeepSeek API key in the Vercel project settings (Environment Variables) as <code className="bg-black/30 px-1.5 py-0.5 rounded">DEEPSEEK_API_KEY</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Summary Cards */}
      {costSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#14141f] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Today&apos;s Cost</p>
                  <p className="text-2xl font-bold text-white">${costSummary.today.cost.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#14141f] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-white/50">This Month</p>
                  <p className="text-2xl font-bold text-white">${costSummary.thisMonth.cost.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#14141f] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Messages Today</p>
                  <p className="text-2xl font-bold text-white">{costSummary.today.messages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-[#14141f] border-white/10 ${costSummary.budget.alert ? "border-red-500/50" : ""}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${costSummary.budget.alert ? "bg-red-500/20" : "bg-amber-500/20"}`}>
                  <AlertTriangle className={`w-5 h-5 ${costSummary.budget.alert ? "text-red-400" : "text-amber-400"}`} />
                </div>
                <div>
                  <p className="text-sm text-white/50">Budget Used</p>
                  <p className="text-2xl font-bold text-white">{costSummary.budget.percentage.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-3 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${costSummary.budget.alert ? "bg-red-500" : "bg-cyan-500"}`}
                  style={{ width: `${Math.min(100, costSummary.budget.percentage)}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-1">
                ${costSummary.budget.used.toFixed(2)} / ${costSummary.budget.limit.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Settings Tabs */}
      <Tabs defaultValue="model" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="model" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Bot className="w-4 h-4 mr-2" />
            Model Settings
          </TabsTrigger>
          <TabsTrigger value="limits" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Zap className="w-4 h-4 mr-2" />
            Usage Limits
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <DollarSign className="w-4 h-4 mr-2" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Users className="w-4 h-4 mr-2" />
            User Costs
          </TabsTrigger>
        </TabsList>

        {/* Model Settings Tab */}
        <TabsContent value="model">
          <Card className="bg-[#14141f] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">AI Model Configuration</CardTitle>
              <CardDescription>Configure the AI model and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  {/* Model Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Model</Label>
                      <Select
                        value={settings.model}
                        onValueChange={(value) => setSettings({ ...settings, model: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deepseek-chat">
                            <div className="flex items-center gap-2">
                              <span>DeepSeek Chat</span>
                              <Badge variant="secondary" className="text-xs">Recommended</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="deepseek-reasoner">
                            <div className="flex items-center gap-2">
                              <span>DeepSeek Reasoner</span>
                              <Badge variant="secondary" className="text-xs">Advanced</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-white/50">
                        {settings.model === "deepseek-chat" 
                          ? "Fast, cost-effective general-purpose model ($0.14/1M input, $0.28/1M output)"
                          : "Advanced reasoning model for complex tasks ($0.55/1M input, $2.19/1M output)"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Max Tokens</Label>
                      <Input
                        type="number"
                        value={settings.maxTokens}
                        onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 4096 })}
                        className="bg-white/5 border-white/10 text-white"
                        min={256}
                        max={32768}
                      />
                      <p className="text-xs text-white/50">Maximum tokens per response (256-32768)</p>
                    </div>
                  </div>

                  {/* Temperature Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Temperature</Label>
                      <span className="text-cyan-400 font-mono">{settings.temperature.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[settings.temperature]}
                      onValueChange={([value]) => setSettings({ ...settings, temperature: value })}
                      min={0}
                      max={1}
                      step={0.05}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Precise (0.0)</span>
                      <span>Balanced (0.5)</span>
                      <span>Creative (1.0)</span>
                    </div>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <Label className="text-white">System Prompt</Label>
                    <Textarea
                      value={settings.systemPrompt}
                      onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                      className="bg-white/5 border-white/10 text-white min-h-[150px] font-mono text-sm"
                      placeholder="Enter the system prompt for your AI..."
                    />
                    <p className="text-xs text-white/50">
                      This prompt defines your AI&apos;s personality and behavior
                    </p>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <Label className="text-white">AI Service Active</Label>
                      <p className="text-xs text-white/50">Enable or disable AI chat for all users</p>
                    </div>
                    <Switch
                      checked={settings.isActive}
                      onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Limits Tab */}
        <TabsContent value="limits">
          <Card className="bg-[#14141f] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Usage Limits</CardTitle>
              <CardDescription>Control how much customers can use the AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Daily Message Limit (per user)</Label>
                      <Input
                        type="number"
                        value={settings.dailyMessageLimit}
                        onChange={(e) => setSettings({ ...settings, dailyMessageLimit: parseInt(e.target.value) || 100 })}
                        className="bg-white/5 border-white/10 text-white"
                        min={1}
                        max={10000}
                      />
                      <p className="text-xs text-white/50">Maximum messages each user can send per day</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Monthly Token Limit (per user)</Label>
                      <Input
                        type="number"
                        value={settings.monthlyTokenLimit}
                        onChange={(e) => setSettings({ ...settings, monthlyTokenLimit: parseInt(e.target.value) || 1000000 })}
                        className="bg-white/5 border-white/10 text-white"
                        min={1000}
                        max={100000000}
                      />
                      <p className="text-xs text-white/50">Maximum tokens each user can use per month</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <Label className="text-white">Auto-Block on Limit</Label>
                      <p className="text-xs text-white/50">Automatically block users when they reach their limits</p>
                    </div>
                    <Switch
                      checked={settings.autoBlockOnLimit}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoBlockOnLimit: checked })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget">
          <Card className="bg-[#14141f] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Budget Settings</CardTitle>
              <CardDescription>Set spending limits and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Monthly Budget (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          type="number"
                          value={settings.monthlyBudgetUsd}
                          onChange={(e) => setSettings({ ...settings, monthlyBudgetUsd: parseFloat(e.target.value) || 100 })}
                          className="bg-white/5 border-white/10 text-white pl-9"
                          min={1}
                          step={10}
                        />
                      </div>
                      <p className="text-xs text-white/50">Maximum DeepSeek API spend per month</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Alert Threshold (%)</Label>
                      <Input
                        type="number"
                        value={settings.budgetAlertThreshold * 100}
                        onChange={(e) => setSettings({ ...settings, budgetAlertThreshold: (parseFloat(e.target.value) || 80) / 100 })}
                        className="bg-white/5 border-white/10 text-white"
                        min={10}
                        max={100}
                      />
                      <p className="text-xs text-white/50">Alert when budget usage reaches this percentage</p>
                    </div>
                  </div>

                  {/* DeepSeek Pricing Reference */}
                  <div className="p-4 bg-white/5 rounded-lg space-y-3">
                    <h4 className="text-white font-medium">DeepSeek Pricing Reference</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-cyan-400 font-medium">DeepSeek Chat</p>
                        <p className="text-white/60">Input: $0.14 / 1M tokens</p>
                        <p className="text-white/60">Output: $0.28 / 1M tokens</p>
                      </div>
                      <div>
                        <p className="text-purple-400 font-medium">DeepSeek Reasoner</p>
                        <p className="text-white/60">Input: $0.55 / 1M tokens</p>
                        <p className="text-white/60">Output: $2.19 / 1M tokens</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Costs Tab */}
        <TabsContent value="users">
          <Card className="bg-[#14141f] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Cost Per User</CardTitle>
              <CardDescription>See how much each user is costing you</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/60">User</TableHead>
                    <TableHead className="text-white/60 text-right">Today&apos;s Messages</TableHead>
                    <TableHead className="text-white/60 text-right">Today&apos;s Cost</TableHead>
                    <TableHead className="text-white/60 text-right">Month Messages</TableHead>
                    <TableHead className="text-white/60 text-right">Month Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-white/40 py-8">
                        No usage data yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    userCosts.map((user) => (
                      <TableRow key={user.userId} className="border-white/10">
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{user.userName || "Unknown"}</p>
                            <p className="text-xs text-white/50">{user.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-white">{user.todayMessages}</TableCell>
                        <TableCell className="text-right text-green-400">${user.todayCost.toFixed(4)}</TableCell>
                        <TableCell className="text-right text-white">{user.monthMessages}</TableCell>
                        <TableCell className="text-right text-cyan-400">${user.monthCost.toFixed(4)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
