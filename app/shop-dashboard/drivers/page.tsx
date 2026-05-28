"use client"

import { useState, useEffect } from "react"
import { useShop } from "../layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Loader2, MapPin, Clock, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Driver {
  id: string
  name: string
  phone: string
  status: "available" | "busy" | "offline"
  current_order?: string
  last_seen: string
}

export default function DriversPage() {
  const { site } = useShop()
  const [drivers, setDrivers] = useState<Driver[]>([])
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
          <h1 className="text-2xl font-bold text-slate-900">Driver Activity</h1>
          <p className="text-slate-500">Monitor your delivery drivers</p>
        </div>
        <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
          <Users className="w-4 h-4" />
          Add Driver
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <p className="text-sm text-slate-500">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <p className="text-sm text-slate-500">On Delivery</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-400">0</div>
              <p className="text-sm text-slate-500">Offline</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="font-semibold text-slate-900">No drivers yet</h3>
          <p className="text-slate-500 text-sm mt-1">Add delivery drivers to track their activity</p>
          <Button className="mt-4 gap-2 bg-orange-500 hover:bg-orange-600">
            <Users className="w-4 h-4" />
            Add First Driver
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
