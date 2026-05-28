"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { 
  Rocket, 
  RefreshCw, 
  Search, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Eye,
  RotateCcw,
  XCircle
} from "lucide-react"

interface Deployment {
  id: string
  siteId: string
  userId: string
  customerName: string
  customerEmail: string
  businessName: string
  status: string
  currentStep: string
  liveUrl: string | null
  subdomain: string | null
  customDomain: string | null
  errorMessage: string | null
  errorLogs: string | null
  retryCount: number
  createdAt: string
  completedAt: string | null
}

export default function AdminDeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [retrying, setRetrying] = useState<string | null>(null)

  const fetchDeployments = async () => {
    try {
      const res = await fetch("/api/admin/site-deployments")
      if (res.ok) {
        const data = await res.json()
        setDeployments(data.deployments || [])
      }
    } catch (error) {
      console.error("Failed to fetch deployments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeployments()
    // Poll for updates
    const interval = setInterval(fetchDeployments, 10000)
    return () => clearInterval(interval)
  }, [])

  const retryDeployment = async (siteId: string) => {
    setRetrying(siteId)
    try {
      await fetch(`/api/site-deployments/${siteId}/retry`, { method: "POST" })
      await fetch(`/api/site-deployments/${siteId}/start`, { method: "POST" })
      fetchDeployments()
    } catch (error) {
      console.error("Failed to retry deployment:", error)
    } finally {
      setRetrying(null)
    }
  }

  const viewLogs = (deployment: Deployment) => {
    setSelectedDeployment(deployment)
    setLogsDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Live
          </Badge>
        )
      case "deploying":
        return (
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Deploying
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredDeployments = deployments.filter(d => 
    d.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.subdomain?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: deployments.length,
    live: deployments.filter(d => d.status === "completed").length,
    deploying: deployments.filter(d => d.status === "deploying").length,
    failed: deployments.filter(d => d.status === "failed").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deployment Monitor</h1>
          <p className="text-slate-500">Monitor and manage all customer deployments</p>
        </div>
        <Button onClick={fetchDeployments} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Rocket className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Deployments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.live}</p>
                <p className="text-xs text-slate-500">Live Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100">
                <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-600">{stats.deploying}</p>
                <p className="text-xs text-slate-500">Deploying</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-xs text-slate-500">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Deployments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search deployments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Live URL</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeployments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No deployments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeployments.map((deployment) => (
                  <TableRow key={deployment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">
                          {deployment.businessName || "Unnamed Site"}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {deployment.siteId.substring(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-slate-900">{deployment.customerName || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{deployment.customerEmail || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getStatusBadge(deployment.status)}
                        {deployment.status === "deploying" && (
                          <p className="text-xs text-slate-500 mt-1">
                            Step: {deployment.currentStep}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {deployment.liveUrl ? (
                        <a
                          href={deployment.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                        >
                          {deployment.subdomain}.mujeebproai.com
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600">
                        {new Date(deployment.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(deployment.createdAt).toLocaleTimeString()}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {deployment.status === "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryDeployment(deployment.siteId)}
                            disabled={retrying === deployment.siteId}
                          >
                            {retrying === deployment.siteId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                        {(deployment.errorLogs || deployment.errorMessage) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewLogs(deployment)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deployment Logs</DialogTitle>
            <DialogDescription>
              Error details for {selectedDeployment?.businessName || "this deployment"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDeployment?.errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Error Message:</p>
                <p className="text-sm text-red-700 mt-1">{selectedDeployment.errorMessage}</p>
              </div>
            )}
            {selectedDeployment?.errorLogs && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Technical Logs:</p>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto">
                  {selectedDeployment.errorLogs}
                </pre>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLogsDialogOpen(false)}>
                Close
              </Button>
              {selectedDeployment && (
                <Button onClick={() => {
                  retryDeployment(selectedDeployment.siteId)
                  setLogsDialogOpen(false)
                }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Deployment
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
