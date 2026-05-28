"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  DollarSign, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Trash2,
  Star,
  Eye,
  EyeOff,
  GripVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  messages_included: number
  extra_message_price: number
  features: string[]
  is_popular: boolean
  is_enabled: boolean
  sort_order: number
}

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans", { credentials: "include" })
      const data = await res.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePlan = async (plan: Plan) => {
    setIsSaving(plan.id)
    setSaveStatus("idle")
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
        credentials: "include"
      })
      if (res.ok) {
        setSaveStatus("success")
        setTimeout(() => setSaveStatus("idle"), 3000)
      } else {
        setSaveStatus("error")
      }
    } catch (error) {
      console.error("Error saving plan:", error)
      setSaveStatus("error")
    } finally {
      setIsSaving(null)
    }
  }

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return
    
    try {
      const res = await fetch(`/api/admin/plans?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setPlans(plans.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
    }
  }

  const addNewPlan = () => {
    const newPlan: Plan = {
      id: `plan_${Date.now()}`,
      name: "New Plan",
      price: 0,
      currency: "GBP",
      messages_included: 100,
      extra_message_price: 0.05,
      features: ["Feature 1", "Feature 2"],
      is_popular: false,
      is_enabled: true,
      sort_order: plans.length + 1
    }
    setPlans([...plans, newPlan])
  }

  const updatePlan = (id: string, field: keyof Plan, value: unknown) => {
    setPlans(plans.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const setPopularPlan = (id: string) => {
    setPlans(plans.map(p => ({ ...p, is_popular: p.id === id })))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-400" />
            Pricing Plans
          </h1>
          <p className="text-muted-foreground mt-1">Edit pricing plans, features, and limits</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "success" && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-green-500"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Saved!</span>
            </motion.div>
          )}
          <Button onClick={addNewPlan} className="bg-gradient-to-r from-green-500 to-emerald-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-card/50 backdrop-blur border-border/50 relative ${!plan.is_enabled ? 'opacity-60' : ''} ${plan.is_popular ? 'ring-2 ring-cyan-500' : ''}`}>
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-xs font-medium text-white flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={plan.name}
                      onChange={(e) => updatePlan(plan.id, "name", e.target.value)}
                      className="text-xl font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPopularPlan(plan.id)}
                        className={`p-1.5 rounded-md transition-colors ${plan.is_popular ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-muted text-muted-foreground'}`}
                        title="Set as Most Popular"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updatePlan(plan.id, "is_enabled", !plan.is_enabled)}
                        className={`p-1.5 rounded-md transition-colors ${plan.is_enabled ? 'text-green-400' : 'text-muted-foreground'}`}
                        title={plan.is_enabled ? "Disable Plan" : "Enable Plan"}
                      >
                        {plan.is_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Price (GBP)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                        <Input
                          type="number"
                          value={plan.price}
                          onChange={(e) => updatePlan(plan.id, "price", parseFloat(e.target.value) || 0)}
                          className="pl-7 bg-background/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Messages/mo</label>
                      <Input
                        type="number"
                        value={plan.messages_included}
                        onChange={(e) => updatePlan(plan.id, "messages_included", parseInt(e.target.value) || 0)}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Extra Message Price (£)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={plan.extra_message_price}
                      onChange={(e) => updatePlan(plan.id, "extra_message_price", parseFloat(e.target.value) || 0)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Features (one per line)</label>
                    <textarea
                      value={plan.features.join("\n")}
                      onChange={(e) => updatePlan(plan.id, "features", e.target.value.split("\n").filter(f => f.trim()))}
                      className="w-full h-24 px-3 py-2 text-sm rounded-md bg-background/50 border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <Button 
                    onClick={() => savePlan(plan)}
                    disabled={isSaving === plan.id}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    {isSaving === plan.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Plan
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
