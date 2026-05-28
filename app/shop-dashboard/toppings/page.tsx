"use client"

import { useState, useEffect } from "react"
import { useShop } from "../layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Pizza, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface AddonGroup {
  id: string
  name: string
  min_selections: number
  max_selections: number
  is_required: boolean
  items: AddonItem[]
}

interface AddonItem {
  id: string
  name: string
  price: number
  is_available: boolean
}

export default function ToppingsPage() {
  const { site } = useShop()
  const [groups, setGroups] = useState<AddonGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (site?.id) fetchGroups()
  }, [site?.id])

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/shop/addons?siteId=${site?.id}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error("Failed to fetch addon groups:", error)
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-slate-900">Toppings & Extras</h1>
          <p className="text-slate-500">Manage addon groups and extra toppings</p>
        </div>
        <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4" />
          Add Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pizza className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-900">No addon groups yet</h3>
            <p className="text-slate-500 text-sm mt-1">Create addon groups like "Extra Toppings", "Sauces", etc.</p>
            <Button className="mt-4 gap-2 bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4" />
              Create First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>
                      {group.is_required ? "Required" : "Optional"} • 
                      Select {group.min_selections}-{group.max_selections} items
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-slate-600">£{(item.price / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
