"use client"

import { useState, useEffect, use } from "react"
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
  ArrowLeft,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Building2
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
  notes: string | null
  original_content: any
  uploaded_files: any[]
  created_at: string
  processed_at: string | null
  published_at: string | null
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock; description: string }> = {
  pending: { 
    label: "Pending Review", 
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20", 
    icon: Clock,
    description: "Your import request is in the queue and will be reviewed by our team within 24-48 hours."
  },
  processing: { 
    label: "Processing", 
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20", 
    icon: Loader2,
    description: "We are currently working on your website import. You will be notified once it's ready."
  },
  completed: { 
    label: "Completed", 
    color: "bg-green-500/10 text-green-500 border-green-500/20", 
    icon: CheckCircle2,
    description: "Your website has been successfully imported! You can now view and customize it."
  },
  failed: { 
    label: "Failed", 
    color: "bg-red-500/10 text-red-500 border-red-500/20", 
    icon: XCircle,
    description: "There was an issue with your import request. Please check the admin notes for details."
  },
}

const statusSteps = [
  { key: "pending", label: "Submitted", icon: FileText },
  { key: "processing", label: "Processing", icon: Loader2 },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
]

export default function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [importData, setImportData] = useState<WebsiteImport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && id) {
      fetchImport()
    }
  }, [user, id])

  const fetchImport = async () => {
    try {
      const res = await fetch(`/api/customer/imports/${id}`)
      if (res.ok) {
        const data = await res.json()
        setImportData(data.import)
      }
    } catch (error) {
      console.error("Failed to fetch import:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIndex = (status: string) => {
    if (status === "failed") return -1
    return statusSteps.findIndex(s => s.key === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!importData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Import Not Found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn&apos;t find this import request.
            </p>
            <Button asChild>
              <Link href="/dashboard/imports">Back to Imports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[importData.import_status] || statusConfig.pending
  const StatusIcon = status.icon
  const currentStepIndex = getStatusIndex(importData.import_status)
  const businessInfo = importData.original_content?.businessInfo || {}

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/imports">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Imports
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Import Request</h1>
              <Badge className={status.color}>
                <StatusIcon className={`w-3 h-3 mr-1 ${importData.import_status === "processing" ? "animate-spin" : ""}`} />
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Submitted {format(new Date(importData.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          {importData.preview_url && (
            <Button asChild>
              <a href={importData.preview_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Preview
              </a>
            </Button>
          )}
        </div>
      </motion.div>

      {/* Progress Steps */}
      {importData.import_status !== "failed" && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const isActive = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                const StepIcon = step.icon
                
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <StepIcon className={`w-5 h-5 ${isCurrent && step.key === "processing" ? "animate-spin" : ""}`} />
                      </div>
                      <span className={`text-sm mt-2 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`flex-1 h-1 mx-4 rounded ${
                        index < currentStepIndex ? "bg-primary" : "bg-muted"
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Message */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              importData.import_status === "completed" ? "bg-green-500/10" :
              importData.import_status === "failed" ? "bg-red-500/10" :
              importData.import_status === "processing" ? "bg-blue-500/10" :
              "bg-amber-500/10"
            }`}>
              <StatusIcon className={`w-6 h-6 ${
                importData.import_status === "completed" ? "text-green-500" :
                importData.import_status === "failed" ? "text-red-500" :
                importData.import_status === "processing" ? "text-blue-500 animate-spin" :
                "text-amber-500"
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{status.label}</h3>
              <p className="text-muted-foreground">{status.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      {importData.admin_notes && (
        <Card className="mb-6 border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Notes from Our Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{importData.admin_notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Import Details */}
        <Card>
          <CardHeader>
            <CardTitle>Import Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {importData.import_type === "url" ? (
                <Globe className="w-5 h-5 text-primary" />
              ) : importData.import_type === "files" ? (
                <Upload className="w-5 h-5 text-primary" />
              ) : (
                <FileText className="w-5 h-5 text-primary" />
              )}
              <div>
                <p className="font-medium">
                  {importData.import_type === "url" ? "Import from URL" : 
                   importData.import_type === "files" ? "File Upload" : "Manual Entry"}
                </p>
                {importData.source_provider && (
                  <p className="text-sm text-muted-foreground">Provider: {importData.source_provider}</p>
                )}
              </div>
            </div>
            
            {importData.source_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Source URL</p>
                <a href={importData.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  {importData.source_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            
            {importData.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your Notes</p>
                <p>{importData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Info (if manual entry) */}
        {importData.import_type === "manual" && businessInfo.businessName && (
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {businessInfo.businessName && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>{businessInfo.businessName}</span>
                </div>
              )}
              {businessInfo.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{businessInfo.email}</span>
                </div>
              )}
              {businessInfo.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{businessInfo.phone}</span>
                </div>
              )}
              {businessInfo.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{businessInfo.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Next Steps */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">1</div>
              <div>
                <p className="font-medium">Review</p>
                <p className="text-sm text-muted-foreground">Our team reviews your request and gathers your existing content.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">2</div>
              <div>
                <p className="font-medium">Build</p>
                <p className="text-sm text-muted-foreground">We create your new website using your chosen theme and content.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">3</div>
              <div>
                <p className="font-medium">Preview & Launch</p>
                <p className="text-sm text-muted-foreground">You&apos;ll get a preview link to review, then we help you launch!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
