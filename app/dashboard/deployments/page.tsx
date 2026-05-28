"use client"

import { useState, useEffect } from "react"
import { 
  Rocket, 
  Globe, 
  Eye, 
  BarChart3, 
  Settings, 
  Copy, 
  Check, 
  ExternalLink,
  RefreshCw,
  Loader2,
  Circle,
  GitBranch,
  Clock,
  Zap,
  Shield,
  Database,
  Server,
  Link2,
  Plus,
  MoreVertical,
  Trash2,
  Edit3,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Deployment {
  id: string
  status: "building" | "ready" | "error" | "queued"
  url: string
  createdAt: string
  branch: string
  commit?: string
}

interface Domain {
  id: string
  domain: string
  isPrimary: boolean
  verified: boolean
  registrar?: string
  dnsRecords?: {
    aRecord: string
    txtRecord: string
  }
}

// Generate verification ID
const generateVerificationId = () => `mujeeb-verify=${crypto.randomUUID().slice(0, 8)}`

export default function DeploymentsPage() {
  const [deployment, setDeployment] = useState<Deployment | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedDns, setCopiedDns] = useState<string | null>(null)
  const [showDomainDialog, setShowDomainDialog] = useState(false)
  const [domainStep, setDomainStep] = useState<"input" | "dns">("input")
  const [newDomain, setNewDomain] = useState("")
  const [pendingDomain, setPendingDomain] = useState<Domain | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [showBranding, setShowBranding] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [analytics, setAnalytics] = useState({ visitors: 0, pageViews: 0, bandwidth: "0 MB" })
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [domainToEdit, setDomainToEdit] = useState<Domain | null>(null)
  const [editDomainValue, setEditDomainValue] = useState("")

  // DNS configuration for MujeebProAI
  const DNS_CONFIG = {
    aRecord: "76.76.21.21", // Example IP - replace with actual
    txtPrefix: "mujeeb-verify="
  }

  useEffect(() => {
    fetchDeploymentData()
  }, [])

  const fetchDeploymentData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/deployments")
      if (res.ok) {
        const data = await res.json()
        setDeployment(data.deployment)
        setDomains(data.domains || [])
        setAnalytics(data.analytics || { visitors: 0, pageViews: 0, bandwidth: "0 MB" })
        setIsPublic(data.isPublic ?? true)
      } else {
        // Set demo data for display
        setDeployment({
          id: "dpl_demo",
          status: "ready",
          url: "https://demo.mujeebproai.com",
          createdAt: new Date().toISOString(),
          branch: "main"
        })
        setDomains([
          { id: "1", domain: "demo.mujeebproai.com", isPrimary: true, verified: true, registrar: "MujeebProAI" }
        ])
        setAnalytics({ visitors: 89, pageViews: 234, bandwidth: "12.4 MB" })
      }
    } catch {
      // Demo fallback
      setDeployment({
        id: "dpl_demo",
        status: "ready",
        url: "https://demo.mujeebproai.com",
        createdAt: new Date().toISOString(),
        branch: "main"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeployment(prev => prev ? { ...prev, status: "building" } : null)
    
    try {
      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deploy" })
      })
      
      if (res.ok) {
        const data = await res.json()
        setDeployment(data.deployment)
      }
      
      // Simulate deployment completion
      setTimeout(() => {
        setDeployment(prev => prev ? { ...prev, status: "ready" } : null)
        setIsDeploying(false)
      }, 3000)
    } catch {
      setIsDeploying(false)
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const copyDnsRecord = (type: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedDns(type)
    setTimeout(() => setCopiedDns(null), 2000)
  }

  const handleAddDomainClick = () => {
    setDomainStep("input")
    setNewDomain("")
    setPendingDomain(null)
    setShowDomainDialog(true)
  }

  const handleDomainNext = () => {
    if (!newDomain.trim()) return
    
    // Create pending domain with DNS records
    const verificationId = generateVerificationId()
    const pending: Domain = {
      id: Date.now().toString(),
      domain: newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""),
      isPrimary: false,
      verified: false,
      registrar: "N/A",
      dnsRecords: {
        aRecord: DNS_CONFIG.aRecord,
        txtRecord: verificationId
      }
    }
    setPendingDomain(pending)
    setDomainStep("dns")
  }

  const handleLinkDomain = async () => {
    if (!pendingDomain) return
    
    // Add domain to list
    setDomains(prev => [...prev, pendingDomain])
    
    // Save to API
    try {
      await fetch("/api/deployments/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingDomain)
      })
    } catch {
      // Continue even if API fails
    }
    
    // Reset dialog
    setShowDomainDialog(false)
    setDomainStep("input")
    setNewDomain("")
    setPendingDomain(null)
  }

  const handleRemoveDomain = async (domain: Domain) => {
    setDomains(prev => prev.filter(d => d.id !== domain.id))
    setDeleteDialogOpen(false)
    setDomainToDelete(null)
    
    // Call API to remove
    try {
      await fetch(`/api/deployments/domains/${domain.id}`, {
        method: "DELETE"
      })
    } catch {
      // Continue even if API fails
    }
  }

  const handleEditDomain = async () => {
    if (!domainToEdit || !editDomainValue.trim()) return
    
    setDomains(prev => prev.map(d => 
      d.id === domainToEdit.id 
        ? { ...d, domain: editDomainValue.trim().toLowerCase() }
        : d
    ))
    
    setEditDialogOpen(false)
    setDomainToEdit(null)
    setEditDomainValue("")
  }

  const handleSetPrimary = (domain: Domain) => {
    setDomains(prev => prev.map(d => ({
      ...d,
      isPrimary: d.id === domain.id
    })))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-emerald-500"
      case "building": return "bg-amber-500 animate-pulse"
      case "error": return "bg-red-500"
      case "queued": return "bg-blue-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready": return "Live"
      case "building": return "Building"
      case "error": return "Error"
      case "queued": return "Queued"
      default: return "Unknown"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return `${seconds}s ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
          <p className="text-white/50 mt-4">Loading deployment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-lg">Production Deployment</span>
              </div>
              {deployment && (
                <Badge 
                  className={`${
                    deployment.status === "ready" 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}
                >
                  <Circle className={`w-2 h-2 mr-1.5 fill-current ${deployment.status === "building" ? "animate-pulse" : ""}`} />
                  {getStatusText(deployment.status)}
                </Badge>
              )}
            </div>
            <Button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Republish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-none h-12">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="domains" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none"
              >
                Domains
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Primary Domain Card */}
            {deployment && (
              <Card className="bg-white/[0.02] border-white/[0.08]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-cyan-400" />
                        <a 
                          href={deployment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-lg font-medium text-white hover:text-cyan-400 transition-colors"
                        >
                          {domains.find(d => d.isPrimary)?.domain || deployment.url.replace("https://", "")}
                        </a>
                        <button
                          onClick={() => copyUrl(deployment.url)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                        >
                          {copiedUrl ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-white/40" />
                          )}
                        </button>
                        <a
                          href={deployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-white/40" />
                        </a>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/50">
                        <div className="flex items-center gap-1.5">
                          <Circle className={`w-2 h-2 ${getStatusColor(deployment.status)}`} />
                          <span>{getStatusText(deployment.status)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Updated {formatDate(deployment.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>{deployment.branch}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-white/[0.1] text-white/70 hover:text-white">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Site
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/[0.02] border-white/[0.08]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50">Visitors</p>
                      <p className="text-2xl font-semibold text-white">{analytics.visitors}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/[0.02] border-white/[0.08]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50">Page Views</p>
                      <p className="text-2xl font-semibold text-white">{analytics.pageViews}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/[0.02] border-white/[0.08]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50">Bandwidth</p>
                      <p className="text-2xl font-semibold text-white">{analytics.bandwidth}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Infrastructure Info */}
            <Card className="bg-white/[0.02] border-white/[0.08]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-white/70">Infrastructure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <Server className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">Region</span>
                  </div>
                  <span className="text-sm text-white">Auto (Edge Network)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">Database</span>
                  </div>
                  <span className="text-sm text-white">Neon PostgreSQL</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">SSL</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domains Tab */}
          <TabsContent value="domains" className="space-y-6 mt-0">
            {/* Buy / Connect Domain Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/[0.02] border-white/[0.08] hover:border-cyan-500/30 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Buy a new domain</h3>
                      <p className="text-sm text-white/50">Search and purchase a domain directly from MujeebProAI</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="bg-white/[0.02] border-white/[0.08] hover:border-cyan-500/30 transition-colors cursor-pointer"
                onClick={handleAddDomainClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <Link2 className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Connect your own domain</h3>
                      <p className="text-sm text-white/50">Link a domain you already own to your project</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Domains Table */}
            <Card className="bg-white/[0.02] border-white/[0.08]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Domains</CardTitle>
                <Button 
                  onClick={handleAddDomainClick}
                  size="sm"
                  className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Domain
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.08] hover:bg-transparent">
                      <TableHead className="text-white/50">Name</TableHead>
                      <TableHead className="text-white/50">Status</TableHead>
                      <TableHead className="text-white/50">Registered With</TableHead>
                      <TableHead className="text-white/50 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain.id} className="border-white/[0.08] hover:bg-white/[0.02]">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-cyan-400" />
                            <span className="text-white font-medium">{domain.domain}</span>
                            {domain.isPrimary && (
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {domain.verified ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-white/70">
                          {domain.registrar || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                Manage
                                <MoreVertical className="w-4 h-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#14141f] border-white/10 w-48">
                              {!domain.isPrimary && (
                                <DropdownMenuItem 
                                  className="text-white/70 hover:text-white cursor-pointer"
                                  onClick={() => handleSetPrimary(domain)}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Set as Primary
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-white/70 hover:text-white cursor-pointer"
                                onClick={() => {
                                  setDomainToEdit(domain)
                                  setEditDomainValue(domain.domain)
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Domain
                              </DropdownMenuItem>
                              {!domain.verified && domain.dnsRecords && (
                                <DropdownMenuItem 
                                  className="text-white/70 hover:text-white cursor-pointer"
                                  onClick={() => {
                                    setPendingDomain(domain)
                                    setDomainStep("dns")
                                    setShowDomainDialog(true)
                                  }}
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  View DNS Records
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem 
                                className="text-red-400 hover:text-red-300 cursor-pointer"
                                onClick={() => {
                                  setDomainToDelete(domain)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Domain
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {domains.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-white/50">
                          No domains configured. Add your first domain above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-0">
            <Card className="bg-white/[0.02] border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-lg">Site Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/[0.02] rounded-lg">
                    <p className="text-sm text-white/50">Total Visitors</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-1">{analytics.visitors}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-lg">
                    <p className="text-sm text-white/50">Page Views</p>
                    <p className="text-3xl font-bold text-purple-400 mt-1">{analytics.pageViews}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-lg">
                    <p className="text-sm text-white/50">Bandwidth Used</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-1">{analytics.bandwidth}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-lg">
                    <p className="text-sm text-white/50">Uptime</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1">99.9%</p>
                  </div>
                </div>
                <p className="text-sm text-white/40 mt-4 text-center">
                  Detailed analytics coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-0">
            <Card className="bg-white/[0.02] border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-lg">Deployment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
                  <div>
                    <p className="text-white font-medium">Visibility</p>
                    <p className="text-sm text-white/50">Make your site publicly accessible</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/70">{isPublic ? "Public" : "Private"}</span>
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
                  <div>
                    <p className="text-white font-medium">Show MujeebProAI Branding</p>
                    <p className="text-sm text-white/50">Display &quot;Powered by MujeebProAI&quot; badge</p>
                  </div>
                  <Switch checked={showBranding} onCheckedChange={setShowBranding} />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-white font-medium">Auto Deploy</p>
                    <p className="text-sm text-white/50">Automatically deploy on code changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Domain Dialog - Multi-step */}
      <Dialog open={showDomainDialog} onOpenChange={setShowDomainDialog}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-md">
          {domainStep === "input" ? (
            <>
              <DialogHeader>
                <DialogTitle>Connect your own domain</DialogTitle>
                <DialogDescription className="text-white/50">
                  Enter the domain you want to connect to your project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Domain Name</Label>
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="example.com"
                    className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30"
                    onKeyDown={(e) => e.key === "Enter" && handleDomainNext()}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDomainDialog(false)}
                  className="border-white/[0.1] text-white/70"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDomainNext} 
                  disabled={!newDomain.trim()}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  Next
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  DNS Records
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    Required
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-white/50">
                  Add the following records to your domain&apos;s DNS settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-white/60">
                  Go to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare) and add these DNS records:
                </p>
                
                {/* A Record */}
                <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">A Record</Badge>
                    <button 
                      onClick={() => copyDnsRecord("a", pendingDomain?.dnsRecords?.aRecord || DNS_CONFIG.aRecord)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedDns === "a" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Hostname</p>
                      <p className="text-white font-mono">@</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Value</p>
                      <p className="text-white font-mono">{pendingDomain?.dnsRecords?.aRecord || DNS_CONFIG.aRecord}</p>
                    </div>
                  </div>
                </div>

                {/* TXT Record */}
                <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">TXT Record</Badge>
                    <button 
                      onClick={() => copyDnsRecord("txt", pendingDomain?.dnsRecords?.txtRecord || "")}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedDns === "txt" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Hostname</p>
                      <p className="text-white font-mono">@</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Value</p>
                      <p className="text-white font-mono text-xs break-all">{pendingDomain?.dnsRecords?.txtRecord}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/40">
                  DNS changes can take up to 48 hours to propagate. We&apos;ll automatically verify your domain once the records are detected.
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDomainDialog(false)
                    setDomainStep("input")
                  }}
                  className="border-white/[0.1] text-white/70"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleLinkDomain}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Link Domain
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Domain Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#14141f] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Domain</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Are you sure you want to remove <span className="text-white font-medium">{domainToDelete?.domain}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => domainToDelete && handleRemoveDomain(domainToDelete)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Domain Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            <DialogDescription className="text-white/50">
              Update the domain name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-white/70">Domain Name</Label>
              <Input
                value={editDomainValue}
                onChange={(e) => setEditDomainValue(e.target.value)}
                placeholder="example.com"
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              className="border-white/[0.1] text-white/70"
            >
              Cancel
            </Button>
            <Button onClick={handleEditDomain} className="bg-cyan-500 hover:bg-cyan-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
