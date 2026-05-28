"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Globe,
  Upload,
  ExternalLink,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"

interface WebsiteImport {
  id: string
  import_type: string
  source_url: string | null
  source_provider: string | null
  import_status: string
  preview_url: string | null
  admin_notes: string | null
  created_at: string
  processed_at: string | null
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "New Request", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  waiting_customer: { label: "Waiting for Your Response", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: AlertCircle },
  in_review: { label: "In Review", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Loader2 },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  // Legacy statuses
  processing: { label: "Processing", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Loader2 },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
}

export default function DashboardImportsPage() {
  const { user } = useAuth()
  const [imports, setImports] = useState<WebsiteImport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchImports()
    }
  }, [user])

  const fetchImports = async () => {
    try {
      const res = await fetch("/api/customer/imports")
      if (res.ok) {
        const data = await res.json()
        setImports(data.imports || [])
      }
    } catch (error) {
      console.error("Failed to fetch imports:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Import Requests</h1>
            <p className="text-muted-foreground mt-1">Track the status of your website import requests</p>
          </div>
          <Button asChild>
            <Link href="/import-website">
              <Upload className="w-4 h-4 mr-2" />
              New Import
            </Link>
          </Button>
        </div>
      </motion.div>

      {imports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Import Requests</h3>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t submitted any website import requests yet.
            </p>
            <Button asChild>
              <Link href="/import-website">Import Your Website</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {imports.map((imp, index) => {
            const status = statusConfig[imp.import_status] || statusConfig.pending
            const StatusIcon = status.icon
            
            return (
              <motion.div
                key={imp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          {imp.import_type === "url" ? (
                            <Globe className="w-6 h-6 text-primary" />
                          ) : imp.import_type === "files" ? (
                            <Upload className="w-6 h-6 text-primary" />
                          ) : (
                            <FileText className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {imp.import_type === "url" ? "URL Import" : 
                               imp.import_type === "files" ? "File Upload" : "Manual Entry"}
                            </h3>
                            <Badge className={status.color}>
                              <StatusIcon className={`w-3 h-3 mr-1 ${imp.import_status === "processing" ? "animate-spin" : ""}`} />
                              {status.label}
                            </Badge>
                          </div>
                          {imp.source_url && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {imp.source_url}
                            </p>
                          )}
                          {imp.source_provider && (
                            <p className="text-sm text-muted-foreground">
                              Provider: {imp.source_provider}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {format(new Date(imp.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                          <Link href={`/dashboard/imports/${imp.id}`}>
                            View Details
                          </Link>
                        </Button>
                        {imp.preview_url && (
                          <Button asChild>
                            <a href={imp.preview_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Preview
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {imp.admin_notes && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <span>{imp.admin_notes}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
