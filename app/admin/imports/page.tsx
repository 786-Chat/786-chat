"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Upload, 
  Globe, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Eye,
  Play,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  AlertCircle,
  Link as LinkIcon,
  Palette,
  ShoppingBag,
  Trash2,
  MoreHorizontal,
  DollarSign,
  Tag,
  RefreshCw,
  MessageSquare,
  Store,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { toast } from "sonner"

interface ImportRequest {
  id: string
  user_id: string
  user_email: string
  user_name?: string
  import_type: "customer_website" | "reusable_theme"
  source_type: "url" | "zip" | "wordpress" | "godaddy" | "replit"
  source_url: string | null
  source_provider: string | null
  uploaded_files: { name: string; size: number; type: string }[]
  original_content: Record<string, unknown>
  selected_theme_id: string | null
  category: string | null
  price: number | null
  import_status: string
  preview_url: string | null
  notes: string | null
  admin_notes: string | null
  rejection_reason: string | null
  site_id: string | null
  created_at: string
  processed_at: string | null
  published_at: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "New Request", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  waiting_customer: { label: "Waiting for Customer", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: MessageSquare },
  in_review: { label: "In Review", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Eye },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  // Legacy statuses
  uploaded: { label: "Uploaded", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: Upload },
  scanning: { label: "Scanning", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: RefreshCw },
  needs_review: { label: "Needs Review", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Eye },
  ready_for_sale: { label: "Ready for Sale", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: ShoppingBag },
  published: { label: "Published", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  changes_requested: { label: "Changes Requested", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: MessageSquare },
}

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  url: { label: "URL Import", color: "bg-blue-500/10 text-blue-500" },
  zip: { label: "ZIP Upload", color: "bg-purple-500/10 text-purple-500" },
  wordpress: { label: "WordPress", color: "bg-cyan-500/10 text-cyan-500" },
  godaddy: { label: "GoDaddy", color: "bg-teal-500/10 text-teal-500" },
  replit: { label: "Replit", color: "bg-orange-500/10 text-orange-500" },
}

const CATEGORIES = [
  "restaurant",
  "cafe",
  "pizza",
  "chicken",
  "bakery",
  "bar",
  "food_truck",
  "catering",
  "other"
]

export default function AdminImportsPage() {
  const [imports, setImports] = useState<ImportRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedImport, setSelectedImport] = useState<ImportRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showPriceDialog, setShowPriceDialog] = useState(false)
  const [showRequestChangesDialog, setShowRequestChangesDialog] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [changesRequested, setChangesRequested] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [priceInput, setPriceInput] = useState("")
  const [approveAsType, setApproveAsType] = useState<"customer_website" | "reusable_theme">("customer_website")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchImports()
  }, [statusFilter, typeFilter])

  const fetchImports = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (typeFilter !== "all") params.append("type", typeFilter)
      
      const res = await fetch(`/api/admin/imports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setImports(data.imports || [])
      }
    } catch (error) {
      console.error("Failed to fetch imports:", error)
      toast.error("Failed to load imports")
    } finally {
      setIsLoading(false)
    }
  }

  const updateImportStatus = async (id: string, status: string, additionalData?: Record<string, unknown>) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admin/imports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          import_status: status,
          admin_notes: adminNotes,
          ...additionalData
        }),
      })
      
      if (res.ok) {
        toast.success(`Import ${status.replace(/_/g, " ")}`)
        fetchImports()
        closeAllDialogs()
      } else {
        toast.error("Failed to update import")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to update import")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedImport) return
    
    await updateImportStatus(selectedImport.id, "approved", {
      import_type: approveAsType,
      category: selectedCategory || null,
    })
  }

  const handleReject = async () => {
    if (!selectedImport) return
    
    await updateImportStatus(selectedImport.id, "rejected", {
      rejection_reason: rejectionReason,
    })
  }

  const handleRequestChanges = async () => {
    if (!selectedImport) return
    
    await updateImportStatus(selectedImport.id, "changes_requested", {
      admin_notes: changesRequested,
    })
  }

  const handleSetPrice = async () => {
    if (!selectedImport) return
    
    const price = parseFloat(priceInput)
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price")
      return
    }
    
    await updateImportStatus(selectedImport.id, "ready_for_sale", {
      price: price,
      category: selectedCategory || selectedImport.category,
    })
  }

  const handlePublish = async (importItem: ImportRequest) => {
    await updateImportStatus(importItem.id, "published")
  }

  const handleStatusChange = async (importItem: ImportRequest, newStatus: string) => {
    await updateImportStatus(importItem.id, newStatus)
  }

  const handleDelete = async (importItem: ImportRequest) => {
    if (!confirm("Are you sure you want to delete this import? This action cannot be undone.")) return
    
    try {
      const res = await fetch(`/api/admin/imports/${importItem.id}`, {
        method: "DELETE",
      })
      
      if (res.ok) {
        toast.success("Import deleted")
        fetchImports()
      } else {
        toast.error("Failed to delete import")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to delete import")
    }
  }

  const closeAllDialogs = () => {
    setShowDetailsDialog(false)
    setShowApproveDialog(false)
    setShowRejectDialog(false)
    setShowPriceDialog(false)
    setShowRequestChangesDialog(false)
    setSelectedImport(null)
    setAdminNotes("")
    setRejectionReason("")
    setChangesRequested("")
    setSelectedCategory("")
    setPriceInput("")
  }

  const openApproveDialog = (importItem: ImportRequest) => {
    setSelectedImport(importItem)
    setSelectedCategory(importItem.category || "")
    setShowApproveDialog(true)
  }

  const openRejectDialog = (importItem: ImportRequest) => {
    setSelectedImport(importItem)
    setShowRejectDialog(true)
  }

  const openPriceDialog = (importItem: ImportRequest) => {
    setSelectedImport(importItem)
    setPriceInput(importItem.price?.toString() || "")
    setSelectedCategory(importItem.category || "")
    setShowPriceDialog(true)
  }

  const openRequestChangesDialog = (importItem: ImportRequest) => {
    setSelectedImport(importItem)
    setShowRequestChangesDialog(true)
  }

  const openDetailsDialog = (importItem: ImportRequest) => {
    setSelectedImport(importItem)
    setAdminNotes(importItem.admin_notes || "")
    setShowDetailsDialog(true)
  }

  const filteredImports = imports.filter(imp => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        imp.user_email?.toLowerCase().includes(query) ||
        imp.source_url?.toLowerCase().includes(query) ||
        imp.id.toLowerCase().includes(query)
      )
    }
    return true
  })

  const stats = {
    total: imports.length,
    pending: imports.filter(i => i.import_status === "pending").length,
    waitingCustomer: imports.filter(i => i.import_status === "waiting_customer").length,
    inReview: imports.filter(i => i.import_status === "in_review").length,
    approved: imports.filter(i => i.import_status === "approved").length,
    completed: imports.filter(i => i.import_status === "completed").length,
    rejected: imports.filter(i => i.import_status === "rejected").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Review System</h1>
        <p className="text-muted-foreground mt-1">Review and manage all imported websites and themes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={stats.pending > 0 ? "border-amber-500/50 bg-amber-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>New Requests</CardDescription>
            <CardTitle className="text-2xl text-amber-500">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Waiting Customer</CardDescription>
            <CardTitle className="text-2xl text-orange-500">{stats.waitingCustomer}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Review</CardDescription>
            <CardTitle className="text-2xl text-blue-500">{stats.inReview}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl text-green-500">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl text-emerald-500">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-2xl text-red-500">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, URL, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Import Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="customer_website">Customer Website</SelectItem>
                <SelectItem value="reusable_theme">Reusable Theme</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">New Request</SelectItem>
                <SelectItem value="waiting_customer">Waiting for Customer</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchImports}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Imports Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredImports.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No imports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Import Type</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Website URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredImports.map((importItem) => {
                    const statusConfig = STATUS_CONFIG[importItem.import_status] || STATUS_CONFIG.pending
                    const sourceConfig = SOURCE_CONFIG[importItem.source_type] || SOURCE_CONFIG.url
                    const StatusIcon = statusConfig.icon
                    const businessInfo = (importItem.original_content?.businessInfo || {}) as { phone?: string; businessName?: string }
                    
                    return (
                      <TableRow key={importItem.id} className={importItem.import_status === "pending" ? "bg-amber-500/5" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{importItem.user_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{importItem.user_email}</p>
                            {businessInfo.phone && (
                              <p className="text-xs text-muted-foreground">{businessInfo.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={sourceConfig.color}>
                            {importItem.import_type === "customer_website" ? (
                              <><Globe className="w-3 h-3 mr-1" />Website</>
                            ) : importItem.import_type === "reusable_theme" ? (
                              <><Palette className="w-3 h-3 mr-1" />Theme</>
                            ) : (
                              <><FileText className="w-3 h-3 mr-1" />Other</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {businessInfo.businessName || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {importItem.source_url ? (
                            <a href={importItem.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate max-w-[200px] block">
                              {importItem.source_url}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(importItem.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetailsDialog(importItem)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {importItem.preview_url && (
                                <DropdownMenuItem asChild>
                                  <a href={importItem.preview_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Preview Import
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              
                              {/* Status-based actions */}
                              {["pending", "waiting_customer", "in_review"].includes(importItem.import_status) && (
                                <>
                                  {importItem.import_status === "pending" && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(importItem, "in_review")}>
                                      <Eye className="w-4 h-4 mr-2 text-blue-500" />
                                      Start Review
                                    </DropdownMenuItem>
                                  )}
                                  {importItem.import_status === "in_review" && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(importItem, "waiting_customer")}>
                                      <MessageSquare className="w-4 h-4 mr-2 text-orange-500" />
                                      Request Info from Customer
                                    </DropdownMenuItem>
                                  )}
                                  {importItem.import_status === "waiting_customer" && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(importItem, "in_review")}>
                                      <Eye className="w-4 h-4 mr-2 text-blue-500" />
                                      Resume Review
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openApproveDialog(importItem)}>
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openRejectDialog(importItem)}>
                                    <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {/* Legacy status actions */}
                              {["uploaded", "scanning", "needs_review", "changes_requested"].includes(importItem.import_status) && (
                                <>
                                  <DropdownMenuItem onClick={() => openApproveDialog(importItem)}>
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openRequestChangesDialog(importItem)}>
                                    <MessageSquare className="w-4 h-4 mr-2 text-orange-500" />
                                    Request Changes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openRejectDialog(importItem)}>
                                    <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {importItem.import_status === "approved" && importItem.import_type === "reusable_theme" && (
                                <DropdownMenuItem onClick={() => openPriceDialog(importItem)}>
                                  <DollarSign className="w-4 h-4 mr-2 text-purple-500" />
                                  Set Price & Prepare for Sale
                                </DropdownMenuItem>
                              )}
                              
                              {importItem.import_status === "approved" && importItem.import_type === "customer_website" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(importItem, "completed")}>
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePublish(importItem)}>
                                    <Globe className="w-4 h-4 mr-2 text-emerald-500" />
                                    Publish Website
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {importItem.import_status === "approved" && !["reusable_theme", "customer_website"].includes(importItem.import_type) && (
                                <DropdownMenuItem onClick={() => handleStatusChange(importItem, "completed")}>
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}
                              
                              {importItem.import_status === "ready_for_sale" && (
                                <DropdownMenuItem onClick={() => handlePublish(importItem)}>
                                  <ShoppingBag className="w-4 h-4 mr-2 text-emerald-500" />
                                  Publish to Marketplace
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(importItem)} className="text-red-500">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Details</DialogTitle>
            <DialogDescription>
              Review the import request details
            </DialogDescription>
          </DialogHeader>
          
          {selectedImport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Import Type</Label>
                  <p className="font-medium capitalize">{selectedImport.import_type?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant="outline" className={STATUS_CONFIG[selectedImport.import_status]?.color}>
                    {STATUS_CONFIG[selectedImport.import_status]?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Source Type</Label>
                  <Badge variant="outline" className={SOURCE_CONFIG[selectedImport.source_type]?.color}>
                    {SOURCE_CONFIG[selectedImport.source_type]?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium capitalize">{selectedImport.category?.replace(/_/g, " ") || "-"}</p>
                </div>
              </div>

              {selectedImport.source_url && (
                <div>
                  <Label className="text-muted-foreground">Source URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={selectedImport.source_url} readOnly />
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedImport.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {selectedImport.uploaded_files?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Uploaded Files</Label>
                  <div className="space-y-2 mt-2">
                    {selectedImport.uploaded_files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedImport.notes && (
                <div>
                  <Label className="text-muted-foreground">Customer Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedImport.notes}</p>
                </div>
              )}

              {selectedImport.rejection_reason && (
                <div>
                  <Label className="text-muted-foreground text-red-500">Rejection Reason</Label>
                  <p className="text-sm mt-1 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                    {selectedImport.rejection_reason}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeAllDialogs}>
                  Close
                </Button>
                <Button onClick={() => updateImportStatus(selectedImport.id, selectedImport.import_status)}>
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Import</DialogTitle>
            <DialogDescription>
              Choose how to approve this import
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Approve As</Label>
              <Select value={approveAsType} onValueChange={(v) => setApproveAsType(v as typeof approveAsType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_website">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Customer Website
                    </div>
                  </SelectItem>
                  <SelectItem value="reusable_theme">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Reusable Master Theme
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {approveAsType === "customer_website" 
                  ? "Will be published as the customer's website"
                  : "Will be added to the theme marketplace for sale"
                }
              </p>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>Cancel</Button>
            <Button onClick={handleApprove} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Import</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this import
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this import is being rejected..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isUpdating || !rejectionReason}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={showRequestChangesDialog} onOpenChange={setShowRequestChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe what changes are needed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Changes Needed</Label>
              <Textarea
                value={changesRequested}
                onChange={(e) => setChangesRequested(e.target.value)}
                placeholder="Describe the changes needed before approval..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>Cancel</Button>
            <Button onClick={handleRequestChanges} disabled={isUpdating || !changesRequested}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Request Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Price Dialog */}
      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price & Prepare for Sale</DialogTitle>
            <DialogDescription>
              Set the price for this theme in the marketplace
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Price (USD)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="49.99"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>Cancel</Button>
            <Button onClick={handleSetPrice} disabled={isUpdating || !priceInput}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
              Ready for Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
