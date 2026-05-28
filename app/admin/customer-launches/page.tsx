"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Rocket,
  Search,
  MoreVertical,
  ExternalLink,
  Eye,
  Ban,
  Check,
  Palette,
  Globe,
  Mail,
  User,
  Calendar,
  Loader2,
  RefreshCw,
  Filter,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Send,
  Power,
  MessageSquare,
  Puzzle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Setup status types
type SetupStatus = 
  | "draft"
  | "payment_pending"
  | "paid"
  | "website_generated"
  | "domain_pending"
  | "google_pending"
  | "live"
  | "suspended"

interface CustomerLaunch {
  id: string
  user_id: string
  site_name: string
  subdomain: string
  custom_domain: string | null
  theme_id: string | null
  theme_name: string | null
  status: string
  setup_status: SetupStatus
  is_active: boolean
  is_published: boolean
  modules: string[]
  payment_status: string
  stripe_subscription_id: string | null
  google_verification_status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
  // Settings info
  business_name?: string
  owner_name?: string
  phone?: string
  email?: string
  // User info
  user_email?: string
  user_name?: string
}

const STATUS_CONFIG: Record<SetupStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  payment_pending: { label: "Payment Pending", color: "bg-yellow-500", icon: CreditCard },
  paid: { label: "Paid", color: "bg-green-500", icon: CheckCircle2 },
  website_generated: { label: "Website Generated", color: "bg-blue-500", icon: Globe },
  domain_pending: { label: "Domain Pending", color: "bg-orange-500", icon: Globe },
  google_pending: { label: "Google Verification Pending", color: "bg-purple-500", icon: MapPin },
  live: { label: "Live", color: "bg-emerald-500", icon: Rocket },
  suspended: { label: "Suspended", color: "bg-red-500", icon: Ban },
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Launches" },
  { value: "payment_pending", label: "Pending Payment" },
  { value: "google_pending", label: "Pending Google" },
  { value: "live", label: "Live" },
  { value: "suspended", label: "Suspended" },
]

export default function CustomerLaunchesPage() {
  const [launches, setLaunches] = useState<CustomerLaunch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLaunch, setSelectedLaunch] = useState<CustomerLaunch | null>(null)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    setup_status: "" as SetupStatus,
    payment_status: "",
    google_verification_status: "",
    is_active: true,
  })

  const fetchLaunches = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/customer-launches")
      if (response.ok) {
        const data = await response.json()
        setLaunches(data.launches || [])
      }
    } catch (error) {
      console.error("Failed to fetch launches:", error)
      toast.error("Failed to fetch customer launches")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLaunches()
  }, [])

  const filteredLaunches = launches.filter(launch => {
    const matchesSearch = 
      launch.site_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      launch.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      launch.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      launch.subdomain?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = statusFilter === "all" || launch.setup_status === statusFilter
    
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: launches.length,
    paymentPending: launches.filter(l => l.setup_status === "payment_pending").length,
    googlePending: launches.filter(l => l.setup_status === "google_pending").length,
    live: launches.filter(l => l.setup_status === "live").length,
    suspended: launches.filter(l => l.setup_status === "suspended").length,
  }

  const handleOpenNotes = (launch: CustomerLaunch) => {
    setSelectedLaunch(launch)
    setAdminNotes(launch.admin_notes || "")
    setShowNotesDialog(true)
  }

  const handleSaveNotes = async () => {
    if (!selectedLaunch) return
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/customer-launches/${selectedLaunch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotes }),
      })
      if (response.ok) {
        toast.success("Notes saved successfully")
        setShowNotesDialog(false)
        fetchLaunches()
      } else {
        toast.error("Failed to save notes")
      }
    } catch (error) {
      toast.error("Failed to save notes")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOpenEdit = (launch: CustomerLaunch) => {
    setSelectedLaunch(launch)
    setEditForm({
      setup_status: launch.setup_status,
      payment_status: launch.payment_status || "pending",
      google_verification_status: launch.google_verification_status || "not_started",
      is_active: launch.is_active,
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedLaunch) return
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/customer-launches/${selectedLaunch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (response.ok) {
        toast.success("Launch updated successfully")
        setShowEditDialog(false)
        fetchLaunches()
      } else {
        toast.error("Failed to update launch")
      }
    } catch (error) {
      toast.error("Failed to update launch")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleQuickAction = async (launchId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/customer-launches/${launchId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (response.ok) {
        toast.success(`Action "${action}" completed`)
        fetchLaunches()
      } else {
        const data = await response.json()
        toast.error(data.error || "Action failed")
      }
    } catch (error) {
      toast.error("Action failed")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: SetupStatus) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
    const Icon = config.icon
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 text-white">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-500 text-white">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getGoogleBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500 text-white">Verified</Badge>
      case "pending":
      case "in_progress":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>
      case "not_started":
        return <Badge variant="outline">Not Started</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDomainBadge = (launch: CustomerLaunch) => {
    if (launch.custom_domain) {
      return <Badge className="bg-green-500 text-white">Custom</Badge>
    }
    return <Badge variant="outline">Subdomain</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Launches</h1>
          <p className="text-muted-foreground">Manage customer website setup progress</p>
        </div>
        <Button onClick={fetchLaunches} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Launches</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.paymentPending}</div>
            <div className="text-sm text-muted-foreground">Pending Payment</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-400">{stats.googlePending}</div>
            <div className="text-sm text-muted-foreground">Pending Google</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-400">{stats.live}</div>
            <div className="text-sm text-muted-foreground">Live</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-400">{stats.suspended}</div>
            <div className="text-sm text-muted-foreground">Suspended</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, business, email, or subdomain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-background/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLaunches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No customer launches found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-muted-foreground">Business</TableHead>
                    <TableHead className="text-muted-foreground">Theme</TableHead>
                    <TableHead className="text-muted-foreground">Modules</TableHead>
                    <TableHead className="text-muted-foreground">Payment</TableHead>
                    <TableHead className="text-muted-foreground">Website</TableHead>
                    <TableHead className="text-muted-foreground">Google</TableHead>
                    <TableHead className="text-muted-foreground">Domain</TableHead>
                    <TableHead className="text-muted-foreground">Created</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLaunches.map((launch, index) => (
                    <motion.tr
                      key={launch.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-border/50 hover:bg-muted/10"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{launch.user_name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{launch.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{launch.business_name || launch.site_name}</div>
                          <div className="text-sm text-muted-foreground">{launch.subdomain}.mujeebproai.com</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-muted-foreground" />
                          <span className="text-white">{launch.theme_name || "None"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Puzzle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-white">{launch.modules?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentBadge(launch.payment_status || "pending")}</TableCell>
                      <TableCell>{getStatusBadge(launch.setup_status)}</TableCell>
                      <TableCell>{getGoogleBadge(launch.google_verification_status || "not_started")}</TableCell>
                      <TableCell>{getDomainBadge(launch)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(launch.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                              <a 
                                href={`https://${launch.subdomain}.mujeebproai.com`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open Customer Site
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a 
                                href={`/dashboard/sites/${launch.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Open Customer Dashboard
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenEdit(launch)}>
                              <FileText className="w-4 h-4 mr-2" />
                              Edit Customer Setup
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickAction(launch.id, "resend_login")}>
                              <Send className="w-4 h-4 mr-2" />
                              Resend Login Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {launch.is_active ? (
                              <DropdownMenuItem 
                                onClick={() => handleQuickAction(launch.id, "suspend")}
                                className="text-red-400"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend Website
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleQuickAction(launch.id, "activate")}
                                className="text-green-400"
                              >
                                <Power className="w-4 h-4 mr-2" />
                                Activate Website
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleQuickAction(launch.id, "mark_complete")}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark Setup Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickAction(launch.id, "request_google")}>
                              <MapPin className="w-4 h-4 mr-2" />
                              Request Google Verification
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenNotes(launch)}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Admin Notes
                              {launch.admin_notes && (
                                <Badge variant="secondary" className="ml-auto text-xs">Has Notes</Badge>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">Admin Notes</DialogTitle>
            <DialogDescription>
              Notes for {selectedLaunch?.business_name || selectedLaunch?.site_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add admin notes about this customer setup..."
                rows={6}
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Customer Setup</DialogTitle>
            <DialogDescription>
              Update setup details for {selectedLaunch?.business_name || selectedLaunch?.site_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Setup Status</Label>
              <Select 
                value={editForm.setup_status} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, setup_status: value as SetupStatus }))}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select 
                value={editForm.payment_status} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, payment_status: value }))}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Google Verification Status</Label>
              <Select 
                value={editForm.google_verification_status} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, google_verification_status: value }))}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select Google status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Website Active</Label>
              <Button
                variant={editForm.is_active ? "default" : "outline"}
                size="sm"
                onClick={() => setEditForm(prev => ({ ...prev, is_active: !prev.is_active }))}
              >
                {editForm.is_active ? "Active" : "Inactive"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
