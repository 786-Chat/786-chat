"use client"

import { useState, useEffect } from "react"
import { useShop } from "../layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Gift, Loader2, Pencil, Trash2, Tag } from "lucide-react"

interface Deal {
  id: string
  name: string
  description: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  is_active: boolean
}

export default function DealsPage() {
  const { site } = useShop()
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (site?.id) {
      setIsLoading(false)
    }
  }, [site?.id])

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
          <h1 className="text-2xl font-bold text-slate-900">Meal Deals</h1>
          <p className="text-slate-500">Create special offers and combo deals</p>
        </div>
        <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4" />
          Create Deal
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Gift className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="font-semibold text-slate-900">No deals yet</h3>
          <p className="text-slate-500 text-sm mt-1">Create meal deals to attract more customers</p>
          <Button className="mt-4 gap-2 bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4" />
            Create First Deal
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
