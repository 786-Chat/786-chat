"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Rocket, 
  Check, 
  Loader2, 
  ExternalLink, 
  Copy, 
  LayoutDashboard,
  Globe,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles
} from "lucide-react"

interface DeploymentStep {
  id: string
  label: string
  status: "pending" | "in_progress" | "completed" | "error"
}

const DEPLOYMENT_STEPS: { id: string; label: string }[] = [
  { id: "preparing", label: "Preparing website" },
  { id: "applying_theme", label: "Applying theme" },
  { id: "uploading_assets", label: "Uploading logo & images" },
  { id: "saving_details", label: "Saving business details" },
  { id: "creating_records", label: "Creating database records" },
  { id: "connecting_domain", label: "Connecting domain" },
  { id: "publishing", label: "Publishing website" },
  { id: "live", label: "Website live" },
]

export default function DeployPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.siteId as string

  const [deployment, setDeployment] = useState<{
    status: string
    currentStep: string
    stepsCompleted: string[]
    liveUrl: string | null
    dashboardUrl: string | null
    subdomain: string | null
    customDomain: string | null
    errorMessage: string | null
    businessName: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const fetchDeployment = useCallback(async () => {
    try {
      const res = await fetch(`/api/site-deployments/${siteId}`)
      if (res.ok) {
        const data = await res.json()
        setDeployment(data)
      }
    } catch (error) {
      console.error("Failed to fetch deployment:", error)
    } finally {
      setLoading(false)
    }
  }, [siteId])

  // Start deployment automatically if not started
  const startDeployment = useCallback(async () => {
    try {
      const res = await fetch(`/api/site-deployments/${siteId}/start`, {
        method: "POST",
      })
      if (res.ok) {
        fetchDeployment()
      }
    } catch (error) {
      console.error("Failed to start deployment:", error)
    }
  }, [siteId, fetchDeployment])

  useEffect(() => {
    fetchDeployment()
  }, [fetchDeployment])

  // Poll for updates while deploying
  useEffect(() => {
    if (deployment?.status === "deploying") {
      const interval = setInterval(fetchDeployment, 2000)
      return () => clearInterval(interval)
    }
  }, [deployment?.status, fetchDeployment])

  // Auto-start deployment if pending
  useEffect(() => {
    if (deployment?.status === "pending") {
      startDeployment()
    }
  }, [deployment?.status, startDeployment])

  const copyUrl = () => {
    if (deployment?.liveUrl) {
      navigator.clipboard.writeText(deployment.liveUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const retryDeployment = async () => {
    setRetrying(true)
    try {
      const res = await fetch(`/api/site-deployments/${siteId}/retry`, {
        method: "POST",
      })
      if (res.ok) {
        fetchDeployment()
      }
    } catch (error) {
      console.error("Failed to retry deployment:", error)
    } finally {
      setRetrying(false)
    }
  }

  const getStepStatus = (stepId: string): "pending" | "in_progress" | "completed" | "error" => {
    if (!deployment) return "pending"
    if (deployment.stepsCompleted.includes(stepId)) return "completed"
    if (deployment.currentStep === stepId) {
      return deployment.status === "failed" ? "error" : "in_progress"
    }
    return "pending"
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      case "in_progress":
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Circle className="w-5 h-5 text-white/20" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
          <p className="mt-4 text-white/60">Loading deployment...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (deployment?.status === "completed") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-[#14141f] border-white/10">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Website Published!</h1>
            <p className="text-white/60 mb-6">
              {deployment.businessName || "Your website"} is now live and ready for visitors.
            </p>

            {/* Live URL */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-6">
              <p className="text-xs text-white/40 mb-2">Your website URL</p>
              <div className="flex items-center justify-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <a 
                  href={deployment.liveUrl || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {deployment.liveUrl}
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                onClick={() => window.open(deployment.liveUrl || "#", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Website
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11 border-white/10 text-white hover:bg-white/[0.05]"
                  onClick={() => router.push(deployment.dashboardUrl || `/shop-dashboard`)}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11 border-white/10 text-white hover:bg-white/[0.05]"
                  onClick={copyUrl}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Custom Domain Instructions */}
            {deployment.customDomain && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
                <h3 className="text-sm font-medium text-amber-300 mb-2">Custom Domain Setup</h3>
                <p className="text-xs text-amber-300/70 mb-3">
                  To use {deployment.customDomain}, add these DNS records:
                </p>
                <div className="bg-black/20 rounded-lg p-3 font-mono text-xs text-white/70 space-y-1">
                  <p>Type: CNAME</p>
                  <p>Name: @ or www</p>
                  <p>Value: cname.mujeebproai.com</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Failed state
  if (deployment?.status === "failed") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-[#14141f] border-white/10">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Deployment Failed</h1>
            <p className="text-white/60 mb-6">
              We could not publish your website. MujeebProAI support has been notified.
            </p>

            <div className="space-y-3">
              <Button
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                onClick={retryDeployment}
                disabled={retrying}
              >
                {retrying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Deployment
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 border-white/10 text-white hover:bg-white/[0.05]"
                onClick={() => router.push("/dashboard")}
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Deploying state - show progress
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-[#14141f] border-white/10">
        <CardContent className="pt-8 pb-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Publishing Your Website</h1>
            <p className="text-white/50 text-sm">
              {deployment?.businessName || "Your website"} is being prepared...
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-1 mb-8">
            {DEPLOYMENT_STEPS.map((step, index) => {
              const status = getStepStatus(step.id)
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    status === "in_progress" 
                      ? "bg-cyan-500/10 border border-cyan-500/20" 
                      : status === "completed"
                      ? "bg-emerald-500/5"
                      : status === "error"
                      ? "bg-red-500/10 border border-red-500/20"
                      : "opacity-50"
                  }`}
                >
                  {getStepIcon(status)}
                  <span className={`text-sm flex-1 ${
                    status === "completed" ? "text-emerald-300" :
                    status === "in_progress" ? "text-cyan-300" :
                    status === "error" ? "text-red-300" :
                    "text-white/40"
                  }`}>
                    {step.label}
                  </span>
                  {status === "completed" && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">Done</Badge>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-white/40 mb-2">
              <span>Progress</span>
              <span>
                {deployment?.stepsCompleted.length || 0} of {DEPLOYMENT_STEPS.length} steps
              </span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ 
                  width: `${((deployment?.stepsCompleted.length || 0) / DEPLOYMENT_STEPS.length) * 100}%` 
                }}
              />
            </div>
          </div>

          <p className="text-xs text-white/30 text-center">
            Please wait while we set up your website. This usually takes 30-60 seconds.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
