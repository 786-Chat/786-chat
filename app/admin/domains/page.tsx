"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Globe,
  Search,
  MoreVertical,
  ExternalLink,
  Check,
  X,
  Ban,
  RefreshCw,
  Filter,
  Loader2,
  Calendar,
  User,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  Star,
  Info
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

interface Domain {
  id: string
  user_id: string
  domain: string
  type: string
  status: string
  verification_token: string | null
  is_primary: boolean
  verified_at: string | null
  created_at: string
  updated_at: string
  user_name: string | null
  user_email: string | null
  user_plan: string | null
  site_id: string | null
  site_name: string | null
  subdomain: string | null
  custom_domain: string | null
  site_status: string | null
}

interface DomainStats {
  total_domains: number
  verified_domains: number
  pending_domains: number
  rejected_domains: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  verified: { label: "Verified", color: "bg-green-500", icon: CheckCircle2 },
  pending: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  rejected: { label: "Rejected", color: "bg-red-500", icon: XCircle },
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Domains" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
]

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [stats, setStats] = useState<DomainStats>({
    total_domains: 0,
    verified_domains: 0,
    pending_domains: 0,
    rejected_domains: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchDomains = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/domains")
      if (response.ok) {
        const data = await response.json()
        setDomains(data.domains || [])
        setStats(data.stats || { total_domains: 0, verified_domains: 0, pending_domains: 0, rejected_domains: 0 })
      } else {
        toast.error("Failed to fetch domains")
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error)
      toast.error("Failed to fetch domains")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDomains()
  }, [])

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = 
      domain.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.site_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = statusFilter === "all" || domain.status === statusFilter
    
    return matchesSearch && matchesFilter
  })

  const handleApprove = async (domainId: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/admin/domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, action: "approve" }),
      })
      if (response.ok) {
        toast.success("Domain approved successfully")
        fetchDomains()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to approve domain")
      }
    } catch (error) {
      toast.error("Failed to approve domain")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async () => {
    if (!selectedDomain) return
    setIsUpdating(true)
    try {
      const response = await fetch("/api/admin/domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          domainId: selectedDomain.id, 
          action: "reject",
          data: { reason: rejectReason }
        }),
      })
      if (response.ok) {
        toast.success("Domain rejected")
        setShowRejectDialog(false)
        setRejectReason("")
        fetchDomains()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to reject domain")
      }
    } catch (error) {
      toast.error("Failed to reject domain")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDomain) return
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/domains?domainId=${selectedDomain.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Domain removed successfully")
        setShowDeleteDialog(false)
        fetchDomains()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to remove domain")
      }
    } catch (error) {
      toast.error("Failed to remove domain")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSetPrimary = async (domainId: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/admin/domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, action: "set_primary" }),
      })
      if (response.ok) {
        toast.success("Primary domain updated")
        fetchDomains()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to set primary domain")
      }
    } catch (error) {
      toast.error("Failed to set primary domain")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReset = async (domainId: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/admin/domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, action: "reset" }),
      })
      if (response.ok) {
        toast.success("Domain status reset to pending")
        fetchDomains()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to reset domain")
      }
    } catch (error) {
      toast.error("Failed to reset domain")
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status]
    if (!config) {
      return <Badge variant="outline">{status}</Badge>
    }
    const Icon = config.icon
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getSiteLink = (domain: Domain) => {
    if (domain.subdomain) {
      return `https://${domain.subdomain}.mujeebproai.com`
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Domain Management</h1>
          <p className="text-muted-foreground">Manage customer domains, approvals, and verification</p>
        </div>
        <Button onClick={fetchDomains} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-white">{stats.total_domains}</div>
            <div className="text-sm text-muted-foreground">Total Domains</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{stats.verified_domains}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending_domains}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-400">{stats.rejected_domains}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
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
                  placeholder="Search by domain, customer name, or email..."
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
          ) : filteredDomains.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No domains found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">Domain</TableHead>
                    <TableHead className="text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Primary</TableHead>
                    <TableHead className="text-muted-foreground">Linked Site</TableHead>
                    <TableHead className="text-muted-foreground">Verified</TableHead>
                    <TableHead className="text-muted-foreground">Created</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDomains.map((domain, index) => (
                    <motion.tr
                      key={domain.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-border/50 hover:bg-muted/10"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <div className="font-medium text-white">{domain.domain}</div>
                            <div className="text-xs text-muted-foreground">{domain.type}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {domain.user_name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {domain.user_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(domain.status)}</TableCell>
                      <TableCell>
                        {domain.is_primary ? (
                          <Badge className="bg-amber-500 text-white gap-1">
                            <Star className="w-3 h-3" />
                            Primary
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Secondary
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {domain.site_name ? (
                          <div>
                            <div className="text-white text-sm">{domain.site_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {domain.subdomain && (
                                <span>{domain.subdomain}.mujeebproai.com</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No site linked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(domain.verified_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(domain.created_at)}</span>
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
                            {/* View Details */}
                            <DropdownMenuItem onClick={() => {
                              setSelectedDomain(domain)
                              setShowDetailsDialog(true)
                            }}>
                              <Info className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>

                            {/* Open Site if linked */}
                            {getSiteLink(domain) && (
                              <DropdownMenuItem asChild>
                                <a 
                                  href={getSiteLink(domain)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Open Site
                                </a>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* Approve */}
                            {domain.status !== "verified" && (
                              <DropdownMenuItem 
                                onClick={() => handleApprove(domain.id)}
                                disabled={isUpdating}
                                className="text-green-400"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Approve Domain
                              </DropdownMenuItem>
                            )}

                            {/* Reject */}
                            {domain.status !== "rejected" && domain.status !== "verified" && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedDomain(domain)
                                  setShowRejectDialog(true)
                                }}
                                disabled={isUpdating}
                                className="text-red-400"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Reject Domain
                              </DropdownMenuItem>
                            )}

                            {/* Reset to Pending */}
                            {(domain.status === "verified" || domain.status === "rejected") && (
                              <DropdownMenuItem 
                                onClick={() => handleReset(domain.id)}
                                disabled={isUpdating}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset to Pending
                              </DropdownMenuItem>
                            )}

                            {/* Set as Primary */}
                            {!domain.is_primary && domain.status === "verified" && (
                              <DropdownMenuItem 
                                onClick={() => handleSetPrimary(domain.id)}
                                disabled={isUpdating}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Set as Primary
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* Delete */}
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedDomain(domain)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Domain
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Domain Details
            </DialogTitle>
          </DialogHeader>
          {selectedDomain && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Domain</Label>
                  <p className="text-white font-medium">{selectedDomain.domain}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Type</Label>
                  <p className="text-white">{selectedDomain.type || "custom"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDomain.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Primary</Label>
                  <p className="text-white">{selectedDomain.is_primary ? "Yes" : "No"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Customer</Label>
                  <p className="text-white">{selectedDomain.user_name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Customer Email</Label>
                  <p className="text-white">{selectedDomain.user_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Verified At</Label>
                  <p className="text-white">{formatDate(selectedDomain.verified_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Created At</Label>
                  <p className="text-white">{formatDate(selectedDomain.created_at)}</p>
                </div>
              </div>
              {selectedDomain.verification_token && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">DNS Verification Token</Label>
                  <div className="bg-background/50 rounded-md p-3">
                    <p className="text-sm font-mono text-white break-all">{selectedDomain.verification_token}</p>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p>Add this TXT record to your domain DNS settings:</p>
                    <code className="block bg-background/30 rounded p-1.5 text-green-400">
                      Type: TXT | Name: @ | Value: {selectedDomain.verification_token}
                    </code>
                  </div>
                </div>
              )}
              {selectedDomain.site_name && (
                <div>
                  <Label className="text-muted-foreground text-xs">Linked Site</Label>
                  <p className="text-white">{selectedDomain.site_name}</p>
                  {selectedDomain.subdomain && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDomain.subdomain}.mujeebproai.com
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Domain</DialogTitle>
            <DialogDescription>
              Reject domain {selectedDomain?.domain} for {selectedDomain?.user_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejecting this domain..."
                rows={4}
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false)
              setRejectReason("")
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isUpdating || !rejectReason.trim()}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">Remove Domain</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this domain? This will also clear the custom domain from any linked customer site.
            </DialogDescription>
          </DialogHeader>
          {selectedDomain && (
            <div className="py-4 space-y-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-400 font-medium">Domain: {selectedDomain.domain}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Customer: {selectedDomain.user_name} ({selectedDomain.user_email})
                    </p>
                    {selectedDomain.site_name && (
                      <p className="text-sm text-muted-foreground">
                        Linked site: {selectedDomain.site_name} — custom domain will be cleared
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
