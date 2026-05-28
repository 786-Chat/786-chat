"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Package, 
  Save, 
  Loader2, 
  Check,
  Pencil,
  Plus,
  Trash2,
  DollarSign,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ModulePricing {
  id: string
  module_id: string
  module_name: string
  description: string
  monthly_price_gbp: number
  setup_fee_gbp: number
  is_active: boolean
  is_included_in_base: boolean
  display_order: number
}

export default function ModulePricingPage() {
  const [modules, setModules] = useState<ModulePricing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingModule, setEditingModule] = useState<ModulePricing | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const res = await fetch("/api/admin/module-pricing", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setModules(data.modules || [])
      }
    } catch (error) {
      console.error("Failed to fetch modules:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editingModule) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/module-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingModule),
        credentials: "include"
      })
      if (res.ok) {
        toast.success("Module pricing updated")
        fetchModules()
        setShowDialog(false)
        setEditingModule(null)
      } else {
        toast.error("Failed to update")
      }
    } catch (error) {
      toast.error("Error saving")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (module: ModulePricing) => {
    try {
      const res = await fetch("/api/admin/module-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...module, is_active: !module.is_active }),
        credentials: "include"
      })
      if (res.ok) {
        toast.success(module.is_active ? "Module disabled" : "Module enabled")
        fetchModules()
      }
    } catch (error) {
      toast.error("Error updating")
    }
  }

  const toggleIncludedInBase = async (module: ModulePricing) => {
    try {
      const res = await fetch("/api/admin/module-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...module, is_included_in_base: !module.is_included_in_base }),
        credentials: "include"
      })
      if (res.ok) {
        toast.success("Updated")
        fetchModules()
      }
    } catch (error) {
      toast.error("Error updating")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  const totalMonthly = modules
    .filter(m => m.is_active && !m.is_included_in_base)
    .reduce((sum, m) => sum + Number(m.monthly_price_gbp), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-400" />
            Module Pricing
          </h1>
          <p className="text-muted-foreground mt-1">
            Set prices for individual modules and features
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{modules.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Free (Included in Base)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {modules.filter(m => m.is_included_in_base).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Max Add-on Revenue/mo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">£{totalMonthly.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Modules Table */}
      <Card className="bg-background/50 border-white/10">
        <CardHeader>
          <CardTitle>All Modules</CardTitle>
          <CardDescription>Configure pricing and availability for each module</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>Module</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>Setup Fee</TableHead>
                <TableHead>Included Free</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id} className="border-white/10">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{module.module_name}</p>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {module.is_included_in_base ? (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">Free</Badge>
                    ) : (
                      <span className="font-mono text-white">£{Number(module.monthly_price_gbp).toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {Number(module.setup_fee_gbp) > 0 ? (
                      <span className="font-mono text-white">£{Number(module.setup_fee_gbp).toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={module.is_included_in_base}
                      onCheckedChange={() => toggleIncludedInBase(module)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={module.is_active}
                      onCheckedChange={() => toggleActive(module)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingModule(module)
                        setShowDialog(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-background border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Module Pricing</DialogTitle>
          </DialogHeader>
          {editingModule && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Module Name</Label>
                <Input
                  value={editingModule.module_name}
                  onChange={(e) => setEditingModule({ ...editingModule, module_name: e.target.value })}
                  className="bg-background/50 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingModule.description || ""}
                  onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                  className="bg-background/50 border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price (GBP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingModule.monthly_price_gbp}
                    onChange={(e) => setEditingModule({ ...editingModule, monthly_price_gbp: parseFloat(e.target.value) || 0 })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Setup Fee (GBP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingModule.setup_fee_gbp}
                    onChange={(e) => setEditingModule({ ...editingModule, setup_fee_gbp: parseFloat(e.target.value) || 0 })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingModule.is_included_in_base}
                    onCheckedChange={(checked) => setEditingModule({ ...editingModule, is_included_in_base: checked })}
                  />
                  <Label>Included Free in Base Plan</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
