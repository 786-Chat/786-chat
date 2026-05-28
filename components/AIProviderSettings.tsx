"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Loader2, 
  Save, 
  DollarSign, 
  Zap, 
  Settings2,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react"

interface ProviderSettings {
  id: string
  provider: string
  is_enabled: boolean
  is_primary: boolean
  model: string
  base_url: string
  input_cost_per_million: number
  output_cost_per_million: number
  max_tokens: number
}

interface AIProviderSettingsProps {
  onUpdate?: () => void
}

export function AIProviderSettings({ onUpdate }: AIProviderSettingsProps) {
  const [providers, setProviders] = useState<ProviderSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/ai-providers")
      if (res.ok) {
        const data = await res.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateProvider = async (providerId: string, updates: Partial<ProviderSettings>) => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/ai-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, ...updates })
      })
      
      if (res.ok) {
        setProviders(prev => 
          prev.map(p => p.id === providerId ? { ...p, ...updates } : p)
        )
        onUpdate?.()
      }
    } catch (error) {
      console.error("Failed to update provider:", error)
    } finally {
      setSaving(false)
    }
  }

  const testProvider = async (provider: ProviderSettings) => {
    setTesting(provider.id)
    setTestResult(null)
    
    try {
      const res = await fetch("/api/admin/ai-providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.provider })
      })
      
      const data = await res.json()
      setTestResult({
        provider: provider.provider,
        success: res.ok,
        message: res.ok ? `Response received in ${data.responseTime}ms` : data.error || "Test failed"
      })
    } catch (error) {
      setTestResult({
        provider: provider.provider,
        success: false,
        message: "Connection failed"
      })
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-purple-500/20">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-200">
            <Settings2 className="w-5 h-5 text-amber-400" />
            AI Provider Settings
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure AI providers, models, and pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {providers.map((provider) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-slate-800/50 border border-purple-500/20 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-purple-500/20">
                    <Brain className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white capitalize">{provider.provider}</h3>
                    <p className="text-sm text-slate-400">{provider.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {provider.is_primary && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Primary</Badge>
                  )}
                  <Badge className={provider.is_enabled 
                    ? "bg-green-500/20 text-green-300 border-green-500/30" 
                    : "bg-slate-700 text-slate-400"
                  }>
                    {provider.is_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Base URL</Label>
                  <Input
                    value={provider.base_url}
                    onChange={(e) => {
                      setProviders(prev => 
                        prev.map(p => p.id === provider.id ? { ...p, base_url: e.target.value } : p)
                      )
                    }}
                    onBlur={(e) => updateProvider(provider.id, { base_url: e.target.value })}
                    className="bg-slate-700/50 border-purple-500/30 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Model</Label>
                  <Input
                    value={provider.model}
                    onChange={(e) => {
                      setProviders(prev => 
                        prev.map(p => p.id === provider.id ? { ...p, model: e.target.value } : p)
                      )
                    }}
                    onBlur={(e) => updateProvider(provider.id, { model: e.target.value })}
                    className="bg-slate-700/50 border-purple-500/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    Input Cost (per million)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={provider.input_cost_per_million}
                    onChange={(e) => {
                      setProviders(prev => 
                        prev.map(p => p.id === provider.id ? { ...p, input_cost_per_million: parseFloat(e.target.value) } : p)
                      )
                    }}
                    onBlur={(e) => updateProvider(provider.id, { input_cost_per_million: parseFloat(e.target.value) })}
                    className="bg-slate-700/50 border-purple-500/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    Output Cost (per million)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={provider.output_cost_per_million}
                    onChange={(e) => {
                      setProviders(prev => 
                        prev.map(p => p.id === provider.id ? { ...p, output_cost_per_million: parseFloat(e.target.value) } : p)
                      )
                    }}
                    onBlur={(e) => updateProvider(provider.id, { output_cost_per_million: parseFloat(e.target.value) })}
                    className="bg-slate-700/50 border-purple-500/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Max Tokens
                  </Label>
                  <Input
                    type="number"
                    value={provider.max_tokens}
                    onChange={(e) => {
                      setProviders(prev => 
                        prev.map(p => p.id === provider.id ? { ...p, max_tokens: parseInt(e.target.value) } : p)
                      )
                    }}
                    onBlur={(e) => updateProvider(provider.id, { max_tokens: parseInt(e.target.value) })}
                    className="bg-slate-700/50 border-purple-500/30 text-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={provider.is_enabled}
                      onCheckedChange={(checked) => updateProvider(provider.id, { is_enabled: checked })}
                    />
                    <Label className="text-slate-300">Enabled</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={provider.is_primary}
                      onCheckedChange={(checked) => updateProvider(provider.id, { is_primary: checked })}
                    />
                    <Label className="text-slate-300">Primary</Label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {testResult && testResult.provider === provider.provider && (
                    <div className={`flex items-center gap-2 text-sm ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                      {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {testResult.message}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider(provider)}
                    disabled={testing === provider.id || !provider.is_enabled}
                    className="border-purple-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    {testing === provider.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}

          {providers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No AI providers configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
