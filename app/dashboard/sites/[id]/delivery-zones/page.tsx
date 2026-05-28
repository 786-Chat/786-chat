"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  MapPin, 
  Plus, 
  Pencil,
  Trash2,
  Loader2,
  Truck,
  Clock,
  Banknote
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DeliveryZone {
  id: string
  zone_name: string
  postcodes: string[]
  delivery_fee: number
  minimum_order: number
  estimated_time_minutes: number
  is_active: boolean
}

export default function DeliveryZonesPage() {
  const params = useParams()
  const siteId = params.id as string
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState({
    zone_name: "",
    postcodes: "",
    delivery_fee: "0",
    minimum_order: "0",
    estimated_time_minutes: "30",
    is_active: true
  })

  useEffect(() => {
    fetchZones()
  }, [siteId])

  const fetchZones = async () => {
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/delivery-zones`)
      if (res.ok) {
        const data = await res.json()
        setZones(data.zones || [])
      }
    } catch (error) {
      console.error("Error fetching delivery zones:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.zone_name.trim()) {
      toast.error("Please enter a zone name")
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        zone_name: formData.zone_name,
        postcodes: formData.postcodes.split(",").map(p => p.trim()).filter(Boolean),
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        minimum_order: parseFloat(formData.minimum_order) || 0,
        estimated_time_minutes: parseInt(formData.estimated_time_minutes) || 30,
        is_active: formData.is_active
      }

      const url = editingZone 
        ? `/api/customer/sites/${siteId}/delivery-zones/${editingZone.id}`
        : `/api/customer/sites/${siteId}/delivery-zones`
      
      const res = await fetch(url, {
        method: editingZone ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(editingZone ? "Zone updated" : "Zone created")
        setShowDialog(false)
        resetForm()
        fetchZones()
      }
    } catch (error) {
      toast.error("Failed to save zone")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone)
    setFormData({
      zone_name: zone.zone_name,
      postcodes: zone.postcodes.join(", "),
      delivery_fee: zone.delivery_fee.toString(),
      minimum_order: zone.minimum_order.toString(),
      estimated_time_minutes: zone.estimated_time_minutes.toString(),
      is_active: zone.is_active
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery zone?")) return
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/delivery-zones/${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast.success("Zone deleted")
        fetchZones()
      }
    } catch (error) {
      toast.error("Failed to delete zone")
    }
  }

  const resetForm = () => {
    setEditingZone(null)
    setFormData({
      zone_name: "",
      postcodes: "",
      delivery_fee: "0",
      minimum_order: "0",
      estimated_time_minutes: "30",
      is_active: true
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Zones</h1>
          <p className="text-muted-foreground">Configure delivery areas, fees, and minimum orders</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingZone ? "Edit Zone" : "Add Delivery Zone"}</DialogTitle>
              <DialogDescription>
                Configure delivery settings for this zone
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Zone Name</Label>
                <Input
                  placeholder="e.g., Local, City Centre, Greater Area"
                  value={formData.zone_name}
                  onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Postcodes (comma separated)</Label>
                <Input
                  placeholder="e.g., E1, E2, E3, EC1"
                  value={formData.postcodes}
                  onChange={(e) => setFormData({ ...formData, postcodes: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Enter postcode prefixes that belong to this zone</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Delivery Fee (GBP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Order (GBP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.minimum_order}
                    onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estimated Delivery Time (minutes)</Label>
                <Input
                  type="number"
                  value={formData.estimated_time_minutes}
                  onChange={(e) => setFormData({ ...formData, estimated_time_minutes: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Zone Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingZone ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Zones</p>
                <p className="text-2xl font-bold">{zones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Truck className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Zones</p>
                <p className="text-2xl font-bold">{zones.filter(z => z.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Banknote className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Delivery Fee</p>
                <p className="text-2xl font-bold">
                  £{zones.length > 0 ? (zones.reduce((acc, z) => acc + z.delivery_fee, 0) / zones.length).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zones List */}
      {zones.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No delivery zones configured</h3>
              <p className="text-muted-foreground mb-4">Add zones to define your delivery areas</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Zone
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <Card key={zone.id} className={!zone.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{zone.zone_name}</CardTitle>
                    <CardDescription>
                      {zone.postcodes.length > 0 
                        ? zone.postcodes.join(", ")
                        : "No postcodes specified"}
                    </CardDescription>
                  </div>
                  <Badge variant={zone.is_active ? "default" : "secondary"}>
                    {zone.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-muted-foreground" />
                    <span>£{zone.delivery_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span>Min £{zone.minimum_order.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{zone.estimated_time_minutes} min</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(zone)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(zone.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
