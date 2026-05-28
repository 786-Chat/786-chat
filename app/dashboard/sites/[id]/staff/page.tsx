"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Users, Plus, MoreVertical, UserCog, ChefHat, Truck, Shield, Loader2, Pencil, Trash2, Copy } from "lucide-react"

interface StaffMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  pin: string
  role: string
  is_active: boolean
  created_at: string
}

const roleConfig = {
  manager: { label: "Manager", icon: Shield, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  kitchen: { label: "Kitchen Staff", icon: ChefHat, color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  driver: { label: "Driver", icon: Truck, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  staff: { label: "Staff", icon: UserCog, color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
}

export default function StaffPage() {
  const params = useParams()
  const siteId = params.id as string
  
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "staff",
    pin: "",
  })

  useEffect(() => {
    fetchStaff()
  }, [siteId])

  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/staff`)
      if (res.ok) {
        const data = await res.json()
        setStaff(data.staff || [])
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error)
    } finally {
      setLoading(false)
    }
  }

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    setFormData(prev => ({ ...prev, pin }))
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!formData.pin || formData.pin.length !== 4) {
      toast.error("4-digit PIN is required")
      return
    }

    setSaving(true)
    try {
      const url = editingStaff 
        ? `/api/customer/sites/${siteId}/staff/${editingStaff.id}`
        : `/api/customer/sites/${siteId}/staff`
      
      const res = await fetch(url, {
        method: editingStaff ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(editingStaff ? "Staff member updated" : "Staff member added")
        setShowAddDialog(false)
        setEditingStaff(null)
        setFormData({ name: "", email: "", phone: "", role: "staff", pin: "" })
        fetchStaff()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to save")
      }
    } catch (error) {
      toast.error("Failed to save staff member")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member)
    setFormData({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      role: member.role,
      pin: member.pin,
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return
    
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/staff/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Staff member removed")
        fetchStaff()
      }
    } catch (error) {
      toast.error("Failed to remove staff member")
    }
  }

  const toggleActive = async (member: StaffMember) => {
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/staff/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !member.is_active }),
      })
      if (res.ok) {
        toast.success(member.is_active ? "Staff member deactivated" : "Staff member activated")
        fetchStaff()
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const copyDashboardLink = (member: StaffMember) => {
    const baseUrl = window.location.origin
    let dashboardPath = ""
    
    if (member.role === "manager") {
      dashboardPath = `/restaurant/${siteId}/manager`
    } else if (member.role === "kitchen") {
      dashboardPath = `/restaurant/${siteId}/kitchen`
    } else if (member.role === "driver") {
      dashboardPath = `/restaurant/${siteId}/driver`
    }
    
    if (dashboardPath) {
      navigator.clipboard.writeText(`${baseUrl}${dashboardPath}?pin=${member.pin}`)
      toast.success("Dashboard link copied to clipboard")
    }
  }

  const staffByRole = {
    manager: staff.filter(s => s.role === "manager"),
    kitchen: staff.filter(s => s.role === "kitchen"),
    driver: staff.filter(s => s.role === "driver"),
    staff: staff.filter(s => s.role === "staff"),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage your restaurant staff and their access</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open)
          if (!open) {
            setEditingStaff(null)
            setFormData({ name: "", email: "", phone: "", role: "staff", pin: "" })
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
              <DialogDescription>
                {editingStaff ? "Update staff member details" : "Add a new staff member with role-based access"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager - Full access</SelectItem>
                    <SelectItem value="kitchen">Kitchen - Order preparation</SelectItem>
                    <SelectItem value="driver">Driver - Deliveries</SelectItem>
                    <SelectItem value="staff">Staff - Basic access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+44 7700 900000"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>4-Digit PIN *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="1234"
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    className="font-mono text-lg tracking-widest"
                  />
                  <Button type="button" variant="outline" onClick={generatePin}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Staff will use this PIN to access their dashboard</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingStaff ? "Update" : "Add Staff"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(roleConfig).map(([role, config]) => {
          const count = staffByRole[role as keyof typeof staffByRole].length
          const Icon = config.icon
          return (
            <Card key={role} className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Staff List */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Staff ({staff.length})
          </CardTitle>
          <CardDescription>Click on a staff member to copy their dashboard link</CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No staff members yet</h3>
              <p className="text-muted-foreground mb-4">Add your first staff member to get started</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((member) => {
                const config = roleConfig[member.role as keyof typeof roleConfig] || roleConfig.staff
                const Icon = config.icon
                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      member.is_active ? "bg-background/50 border-border/50" : "bg-muted/30 border-border/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          {!member.is_active && (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="outline" className={config.color}>{config.label}</Badge>
                          <span className="font-mono">PIN: {member.pin}</span>
                          {member.phone && <span>{member.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyDashboardLink(member)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Dashboard Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(member)}>
                          {member.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(member.id)} className="text-red-500">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
