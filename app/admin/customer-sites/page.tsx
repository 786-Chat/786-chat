"use client"

import { useState, useEffect } from "react"
import { 
  Globe,
  Search,
  MoreVertical,
  ExternalLink,
  Eye,
  Ban,
  Check,
  Palette,
  Layers,
  Key,
  Link2,
  User,
  Loader2,
  RefreshCw,
  Filter,
  Copy,
  CreditCard,
  Store,
  Settings,
  Trash2,
  AlertTriangle,
  DollarSign,
  LayoutDashboard
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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

interface CustomerSite {
  id: string
  user_id: string
  site_name: string
  subdomain: string
  custom_domain: string | null
  theme_id: string | null
  theme_name: string | null
  status: string
  is_active: boolean
  is_published: boolean
  is_locked: boolean
  lock_reason: string | null
  modules: string[]
  created_at: string
  updated_at: string
  // User info
  user_email?: string
  user_name?: string
  user_plan?: string
  // Settings info
  business_name?: string
  phone?: string
  business_email?: string
  payment_status?: string
  show_in_marketplace?: boolean
  marketplace_approved?: boolean
  marketplace_featured?: boolean
  marketplace_category?: string
  is_open?: boolean
  visibility_mode?: string
}

interface Theme {
  id: string
  name: string
  slug: string
}

const AVAILABLE_MODULES = [
  { id: "online_ordering", name: "Online Ordering", description: "Accept orders from website" },
  { id: "kitchen_display", name: "Kitchen Display", description: "Real-time kitchen order screen" },
  { id: "driver_app", name: "Driver App", description: "Delivery driver management" },
  { id: "google_business", name: "Google Business", description: "Google Business Profile sync" },
  { id: "import_website", name: "Import Website", description: "Import existing website content" },
  { id: "pos_lite", name: "POS Lite", description: "Simple point of sale" },
  { id: "receipt_printing", name: "Receipt Printing", description: "Thermal receipt printer support" },
  { id: "marketplace", name: "Marketplace Listing", description: "List on food marketplace" },
  { id: "table_booking", name: "Table Booking", description: "Reservation system" },
  { id: "delivery_tracking", name: "Delivery Tracking", description: "Live delivery tracking" },
  { id: "reviews", name: "Reviews", description: "Customer reviews system" },
  { id: "loyalty", name: "Loyalty Program", description: "Points and rewards" },
  { id: "gallery", name: "Gallery", description: "Photo gallery" },
  { id: "menu_builder", name: "Menu Builder", description: "Advanced menu editor" },
  { id: "analytics", name: "Analytics", description: "Business insights" },
  { id: "qr_codes", name: "QR Codes", description: "Table ordering QR codes" },
]

export default function CustomerSitesPage() {
  const [sites, setSites] = useState<CustomerSite[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  
  // Modal states
  const [selectedSite, setSelectedSite] = useState<CustomerSite | null>(null)
  const [showChangeThemeModal, setShowChangeThemeModal] = useState(false)
  const [showModulesModal, setShowModulesModal] = useState(false)
  const [showDomainModal, setShowDomainModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [newThemeId, setNewThemeId] = useState("")
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [newSubdomain, setNewSubdomain] = useState("")
  const [newCustomDomain, setNewCustomDomain] = useState("")
  const [newPassword, setNewPassword] = useState("")
  
  // Duplicate form state
  const [duplicateSubdomain, setDuplicateSubdomain] = useState("")
  const [duplicateSiteName, setDuplicateSiteName] = useState("")
  const [duplicateCopyMenu, setDuplicateCopyMenu] = useState(true)
  const [duplicateCopyTheme, setDuplicateCopyTheme] = useState(true)
  const [duplicateResetDetails, setDuplicateResetDetails] = useState(true)

  useEffect(() => {
    fetchSites()
    fetchThemes()
  }, [])

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/admin/customer-sites")
      if (res.ok) {
        const data = await res.json()
        setSites(data.sites || [])
      }
    } catch (error) {
      console.error("Failed to fetch sites:", error)
      toast.error("Failed to load customer sites")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchThemes = async () => {
    try {
      const res = await fetch("/api/admin/master-themes")
      if (res.ok) {
        const data = await res.json()
        setThemes(data.themes || [])
      }
    } catch (error) {
      console.error("Failed to fetch themes:", error)
    }
  }

  const handleSuspend = async (site: CustomerSite) => {
    if (!confirm(`Are you sure you want to suspend "${site.site_name}"?`)) return
    
    try {
      const res = await fetch(`/api/admin/customer-sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false, status: "suspended" }),
      })
      
      if (res.ok) {
        toast.success("Site suspended successfully")
        fetchSites()
      } else {
        toast.error("Failed to suspend site")
      }
    } catch {
      toast.error("Failed to suspend site")
    }
  }

  const handleActivate = async (site: CustomerSite) => {
    try {
      const res = await fetch(`/api/admin/customer-sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true, status: "active" }),
      })
      
      if (res.ok) {
        toast.success("Site activated successfully")
        fetchSites()
      } else {
        toast.error("Failed to activate site")
      }
    } catch {
      toast.error("Failed to activate site")
    }
  }

  const handleLockForPayment = async (site: CustomerSite) => {
    if (!confirm(`Lock "${site.site_name}" for unpaid payment? The public website will show unavailable message.`)) return
    
    try {
      const res = await fetch(`/api/admin/customer-sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock_for_payment: true }),
      })
      
      if (res.ok) {
        toast.success("Site locked for payment")
        fetchSites()
      } else {
        toast.error("Failed to lock site")
      }
    } catch {
      toast.error("Failed to lock site")
    }
  }

  const handleUnlockPayment = async (site: CustomerSite) => {
    try {
      const res = await fetch(`/api/admin/customer-sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock_after_payment: true }),
      })
      
      if (res.ok) {
        toast.success("Site unlocked after payment")
        fetchSites()
      } else {
        toast.error("Failed to unlock site")
      }
    } catch {
      toast.error("Failed to unlock site")
    }
  }

  const handleDelete = async () => {
    if (!selectedSite) return
    
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/customer-sites/${selectedSite.id}`, {
        method: "DELETE",
      })
      
      if (res.ok) {
        toast.success("Site deleted successfully")
        setShowDeleteModal(false)
        setSelectedSite(null)
        fetchSites()
      } else {
        toast.error("Failed to delete site")
      }
    } catch {
      toast.error("Failed to delete site")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeTheme = async () => {
    if (!selectedSite || !newThemeId) return
    
    setIsSaving(true)
    try {
      const selectedTheme = themes.find(t => t.id === newThemeId)
      const res = await fetch(`/api/admin/customer-sites/${selectedSite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          theme_id: newThemeId,
          theme_name: selectedTheme?.name || null,
        }),
      })
      
      if (res.ok) {
        toast.success("Theme changed successfully")
        setShowChangeThemeModal(false)
        setSelectedSite(null)
        setNewThemeId("")
        fetchSites()
      } else {
        toast.error("Failed to change theme")
      }
    } catch {
      toast.error("Failed to change theme")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateModules = async () => {
    if (!selectedSite) return
    
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/customer-sites/${selectedSite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: selectedModules }),
      })
      
      if (res.ok) {
        toast.success("Modules updated successfully")
        setShowModulesModal(false)
        setSelectedSite(null)
        setSelectedModules([])
        fetchSites()
      } else {
        toast.error("Failed to update modules")
      }
    } catch {
      toast.error("Failed to update modules")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateDomain = async () => {
    if (!selectedSite) return
    
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/customer-sites/${selectedSite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subdomain: newSubdomain || selectedSite.subdomain,
          custom_domain: newCustomDomain || null,
        }),
      })
      
      if (res.ok) {
        toast.success("Domain settings updated")
        setShowDomainModal(false)
        setSelectedSite(null)
        setNewSubdomain("")
        setNewCustomDomain("")
        fetchSites()
      } else {
        toast.error("Failed to update domain")
      }
    } catch {
      toast.error("Failed to update domain")
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedSite || !newPassword) return
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/customer-sites/${selectedSite.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      
      if (res.ok) {
        toast.success("Manager password reset successfully")
        setShowResetPasswordModal(false)
        setSelectedSite(null)
        setNewPassword("")
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to reset password")
      }
    } catch {
      toast.error("Failed to reset password")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicate = async () => {
    if (!selectedSite || !duplicateSubdomain || !duplicateSiteName) return
    
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/customer-sites/${selectedSite.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_subdomain: duplicateSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          new_site_name: duplicateSiteName,
          copy_menu: duplicateCopyMenu,
          copy_theme: duplicateCopyTheme,
          copy_layout: duplicateCopyTheme,
          reset_business_details: duplicateResetDetails,
        }),
      })
      
      if (res.ok) {
        toast.success("Site duplicated successfully")
        setShowDuplicateModal(false)
        setSelectedSite(null)
        setDuplicateSubdomain("")
        setDuplicateSiteName("")
        fetchSites()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to duplicate site")
      }
    } catch {
      toast.error("Failed to duplicate site")
    } finally {
      setIsSaving(false)
    }
  }

  const openModulesModal = (site: CustomerSite) => {
    setSelectedSite(site)
    setSelectedModules(site.modules || [])
    setShowModulesModal(true)
  }

  const openDomainModal = (site: CustomerSite) => {
    setSelectedSite(site)
    setNewSubdomain(site.subdomain)
    setNewCustomDomain(site.custom_domain || "")
    setShowDomainModal(true)
  }

  const openDuplicateModal = (site: CustomerSite) => {
    setSelectedSite(site)
    setDuplicateSubdomain("")
    setDuplicateSiteName(`${site.site_name} - Copy`)
    setDuplicateCopyMenu(true)
    setDuplicateCopyTheme(true)
    setDuplicateResetDetails(true)
    setShowDuplicateModal(true)
  }

  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.site_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (site.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && site.is_active && !site.is_locked) ||
      (statusFilter === "suspended" && !site.is_active) ||
      (statusFilter === "locked" && site.is_locked) ||
      (statusFilter === "published" && site.is_published)
    const matchesPayment = paymentFilter === "all" ||
      (paymentFilter === "paid" && site.payment_status === "paid") ||
      (paymentFilter === "overdue" && site.payment_status === "overdue") ||
      (paymentFilter === "pending" && (!site.payment_status || site.payment_status === "pending"))
    return matchesSearch && matchesStatus && matchesPayment
  })

  const stats = {
    total: sites.length,
    active: sites.filter(s => s.is_active && !s.is_locked).length,
    suspended: sites.filter(s => !s.is_active || s.is_locked).length,
    published: sites.filter(s => s.is_published).length,
    paymentDue: sites.filter(s => s.payment_status === "overdue" || s.is_locked).length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Sites / Branches</h1>
          <p className="text-muted-foreground mt-1">
            Manage all customer websites, payments, and modules
          </p>
        </div>
        <Button variant="outline" onClick={fetchSites} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Ban className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.suspended}</p>
                <p className="text-xs text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <CreditCard className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.paymentDue}</p>
                <p className="text-xs text-muted-foreground">Payment Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, subdomain, business, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="locked">Locked (Payment)</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-40">
            <DollarSign className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sites Table */}
      <Card className="bg-card/50 border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site / Business</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Theme</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Marketplace</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSites.map((site) => (
              <TableRow key={site.id} className={site.is_locked ? "bg-red-500/5" : ""}>
                <TableCell>
                  <div>
                    <p className="font-medium">{site.site_name}</p>
                    {site.business_name && (
                      <p className="text-sm text-primary">{site.business_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {site.subdomain}.mujeebproai.com
                    </p>
                    {site.custom_domain && (
                      <p className="text-xs text-blue-500">{site.custom_domain}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm">{site.user_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{site.user_email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {site.theme_name ? (
                    <Badge variant="outline">{site.theme_name}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">No theme</span>
                  )}
                </TableCell>
                <TableCell>
                  {site.is_locked || site.payment_status === "overdue" ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Overdue
                    </Badge>
                  ) : site.payment_status === "paid" ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {site.is_locked ? (
                      <Badge variant="destructive" className="w-fit">
                        Locked
                      </Badge>
                    ) : site.is_active ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 w-fit">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="w-fit">Suspended</Badge>
                    )}
                    {site.is_published && (
                      <Badge variant="secondary" className="w-fit text-xs">Published</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {site.show_in_marketplace ? (
                    site.marketplace_approved ? (
                      <Badge className="bg-green-500/10 text-green-600">
                        <Store className="w-3 h-3 mr-1" />
                        Listed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )
                  ) : (
                    <span className="text-muted-foreground text-xs">Not listed</span>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground">
                    {new Date(site.created_at).toLocaleDateString()}
                  </p>
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
                          href={`/dashboard/sites/${site.id}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Open Customer Dashboard
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a 
                          href={`/restaurant/${site.id}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Public Website
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      
                      {/* Theme & Modules */}
                      <DropdownMenuItem onClick={() => {
                        setSelectedSite(site)
                        setNewThemeId(site.theme_id || "")
                        setShowChangeThemeModal(true)
                      }}>
                        <Palette className="w-4 h-4 mr-2" />
                        Change Theme
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openModulesModal(site)}>
                        <Layers className="w-4 h-4 mr-2" />
                        Manage Modules
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDomainModal(site)}>
                        <Link2 className="w-4 h-4 mr-2" />
                        Domain Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedSite(site)
                        setShowResetPasswordModal(true)
                      }}>
                        <Key className="w-4 h-4 mr-2" />
                        Reset Manager Password
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Duplicate */}
                      <DropdownMenuItem onClick={() => openDuplicateModal(site)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate Branch
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Payment Controls */}
                      {site.is_locked ? (
                        <DropdownMenuItem 
                          onClick={() => handleUnlockPayment(site)}
                          className="text-green-500 focus:text-green-500"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Unlock (Payment Received)
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleLockForPayment(site)}
                          className="text-amber-500 focus:text-amber-500"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Lock for Unpaid Payment
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      {/* Status Controls */}
                      {site.is_active && !site.is_locked ? (
                        <DropdownMenuItem 
                          onClick={() => handleSuspend(site)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Suspend Site
                        </DropdownMenuItem>
                      ) : !site.is_locked && (
                        <DropdownMenuItem 
                          onClick={() => handleActivate(site)}
                          className="text-green-500 focus:text-green-500"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Activate Site
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedSite(site)
                          setShowDeleteModal(true)
                        }}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Site
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredSites.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No customer sites found</p>
          </div>
        )}
      </Card>

      {/* Change Theme Modal */}
      <Dialog open={showChangeThemeModal} onOpenChange={setShowChangeThemeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Theme</DialogTitle>
            <DialogDescription>
              Select a new theme for &quot;{selectedSite?.site_name}&quot;
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label>Select Theme</Label>
            <Select value={newThemeId} onValueChange={setNewThemeId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map(theme => (
                  <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeThemeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeTheme} disabled={isSaving || !newThemeId}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Change Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modules Modal */}
      <Dialog open={showModulesModal} onOpenChange={setShowModulesModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Modules</DialogTitle>
            <DialogDescription>
              Enable or disable modules for &quot;{selectedSite?.site_name}&quot;
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3 max-h-96 overflow-y-auto">
            {AVAILABLE_MODULES.map(module => (
              <div key={module.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div>
                  <Label className="font-medium">{module.name}</Label>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
                <Switch
                  checked={selectedModules.includes(module.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedModules([...selectedModules, module.id])
                    } else {
                      setSelectedModules(selectedModules.filter(m => m !== module.id))
                    }
                  }}
                />
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModulesModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateModules} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Modules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Modal */}
      <Dialog open={showDomainModal} onOpenChange={setShowDomainModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Domain Settings</DialogTitle>
            <DialogDescription>
              Update subdomain or custom domain for &quot;{selectedSite?.site_name}&quot;
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newSubdomain}
                  onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
                <span className="text-muted-foreground text-sm">.mujeebproai.com</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Custom Domain (optional)</Label>
              <Input
                value={newCustomDomain}
                onChange={(e) => setNewCustomDomain(e.target.value)}
                placeholder="www.example.com"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDomainModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDomain} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Manager Password</DialogTitle>
            <DialogDescription>
              Set a new manager password for &quot;{selectedSite?.site_name}&quot;
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={isSaving || newPassword.length < 8}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Modal */}
      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Branch</DialogTitle>
            <DialogDescription>
              Create a copy of &quot;{selectedSite?.site_name}&quot; for a new customer
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>New Site Name</Label>
              <Input
                value={duplicateSiteName}
                onChange={(e) => setDuplicateSiteName(e.target.value)}
                placeholder="Enter site name"
              />
            </div>
            <div className="space-y-2">
              <Label>New Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={duplicateSubdomain}
                  onChange={(e) => setDuplicateSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="new-restaurant"
                />
                <span className="text-muted-foreground text-sm">.mujeebproai.com</span>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <Label className="text-muted-foreground">Copy Options</Label>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="copyMenu"
                  checked={duplicateCopyMenu}
                  onCheckedChange={(checked) => setDuplicateCopyMenu(checked as boolean)}
                />
                <Label htmlFor="copyMenu" className="font-normal">Copy menu items and categories</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="copyTheme"
                  checked={duplicateCopyTheme}
                  onCheckedChange={(checked) => setDuplicateCopyTheme(checked as boolean)}
                />
                <Label htmlFor="copyTheme" className="font-normal">Copy theme and layout</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="resetDetails"
                  checked={duplicateResetDetails}
                  onCheckedChange={(checked) => setDuplicateResetDetails(checked as boolean)}
                />
                <Label htmlFor="resetDetails" className="font-normal">Reset business details (name, logo, contact)</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={isSaving || !duplicateSubdomain || !duplicateSiteName}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Duplicate Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete &quot;{selectedSite?.site_name}&quot;? 
              This will remove all data including menu items, orders, and settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
