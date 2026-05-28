"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  MapPin, 
  Search, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Sparkles,
  Eye,
  Play,
  Check,
  X,
  ChevronDown,
  Building2,
  Phone,
  Mail,
  Globe,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

interface GoogleSetupRequest {
  id: string
  site_id: string
  site_name: string
  subdomain: string
  owner_name: string
  owner_email: string
  google_verification_status: string
  google_setup_notes: string | null
  google_setup_requested_at: string | null
  google_business_profile_url: string | null
  google_connected_email: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  assisted_setup_requested: { label: "Requested", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  assisted_setup_in_progress: { label: "In Progress", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  pending_verification: { label: "Pending Verification", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  verified: { label: "Verified", color: "text-green-500", bgColor: "bg-green-500/10" },
  not_started: { label: "Not Started", color: "text-gray-500", bgColor: "bg-gray-500/10" },
}

export default function AdminGoogleBusinessPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<GoogleSetupRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [updateData, setUpdateData] = useState({
    status: "",
    profileUrl: "",
    connectedEmail: "",
    notes: "",
  })

  const { data, mutate, isLoading } = useSWR("/api/admin/google-business", fetcher)
  const requests: GoogleSetupRequest[] = data?.requests || []

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.site_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.owner_email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || req.google_verification_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (request: GoogleSetupRequest) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

  const handleStartUpdate = (request: GoogleSetupRequest) => {
    setSelectedRequest(request)
    setUpdateData({
      status: request.google_verification_status,
      profileUrl: request.google_business_profile_url || "",
      connectedEmail: request.google_connected_email || "",
      notes: "",
    })
    setShowUpdateModal(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return
    setIsUpdating(true)
    
    try {
      const res = await fetch(`/api/admin/google-business/${selectedRequest.site_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      })
      
      if (res.ok) {
        toast.success("Status updated successfully")
        mutate()
        setShowUpdateModal(false)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update status")
      }
    } catch {
      toast.error("Failed to update status")
    } finally {
      setIsUpdating(false)
    }
  }

  const parseSetupNotes = (notes: string | null) => {
    if (!notes) return null
    try {
      return JSON.parse(notes)
    } catch {
      return { additionalNotes: notes }
    }
  }

  const stats = {
    total: requests.length,
    requested: requests.filter(r => r.google_verification_status === "assisted_setup_requested").length,
    inProgress: requests.filter(r => r.google_verification_status === "assisted_setup_in_progress").length,
    completed: requests.filter(r => r.google_verification_status === "verified").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Google Business Setup</h1>
          <p className="text-muted-foreground">
            Manage customer Google Business Profile setup requests
          </p>
        </div>
        <Button onClick={() => mutate()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.requested}</p>
                <p className="text-sm text-muted-foreground">New Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by site name, subdomain, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Status: {statusFilter === "all" ? "All" : STATUS_CONFIG[statusFilter]?.label || statusFilter}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("assisted_setup_requested")}>Requested</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("assisted_setup_in_progress")}>In Progress</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("pending_verification")}>Pending Verification</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("verified")}>Verified</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No setup requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request, i) => {
            const statusConfig = STATUS_CONFIG[request.google_verification_status] || STATUS_CONFIG.not_started
            const notes = parseSetupNotes(request.google_setup_notes)
            
            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Site Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{request.site_name}</h3>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {request.subdomain}.mujeebproai.com
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {notes?.businessName || request.site_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {request.owner_email}
                          </span>
                          {request.google_setup_requested_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(request.google_setup_requested_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                        <Button size="sm" onClick={() => handleStartUpdate(request)}>
                          {request.google_verification_status === "assisted_setup_requested" ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Start Setup
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Update
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Setup Request Details</DialogTitle>
            <DialogDescription>
              {selectedRequest?.site_name} - {selectedRequest?.subdomain}.mujeebproai.com
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {(() => {
                const notes = parseSetupNotes(selectedRequest.google_setup_notes)
                if (!notes) return <p className="text-muted-foreground">No details available</p>
                
                return (
                  <div className="grid gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Business Name</p>
                        <p className="font-medium">{notes.businessName}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        <p className="font-medium">{notes.category || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <p className="font-medium">{notes.address}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Phone</p>
                        <p className="font-medium">{notes.phone}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Email</p>
                        <p className="font-medium">{notes.email}</p>
                      </div>
                    </div>
                    {notes.description && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{notes.description}</p>
                      </div>
                    )}
                    {notes.additionalNotes && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                        <p className="text-sm">{notes.additionalNotes}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground mb-1">Requested By</p>
                      <p className="font-medium">{notes.requestedBy}</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Close</Button>
            <Button onClick={() => {
              setShowDetailsModal(false)
              if (selectedRequest) handleStartUpdate(selectedRequest)
            }}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Setup Status</DialogTitle>
            <DialogDescription>
              {selectedRequest?.site_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {STATUS_CONFIG[updateData.status]?.label || "Select status"}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => setUpdateData({ ...updateData, status: "assisted_setup_in_progress" })}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUpdateData({ ...updateData, status: "pending_verification" })}>
                    Pending Verification
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUpdateData({ ...updateData, status: "verified" })}>
                    Verified / Complete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-2">
              <Label>Google Business Profile URL</Label>
              <Input
                value={updateData.profileUrl}
                onChange={(e) => setUpdateData({ ...updateData, profileUrl: e.target.value })}
                placeholder="https://g.page/business-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Connected Google Email</Label>
              <Input
                value={updateData.connectedEmail}
                onChange={(e) => setUpdateData({ ...updateData, connectedEmail: e.target.value })}
                placeholder="business@gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                value={updateData.notes}
                onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                placeholder="Notes about the setup process..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateModal(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
