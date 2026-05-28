"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Globe, 
  Palette, 
  Building2, 
  LayoutDashboard, 
  Database, 
  Settings, 
  CheckCircle2,
  Loader2,
  Rocket,
  ExternalLink,
  Copy,
  User,
  Key,
  Eye,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { toast } from "sonner"

interface GenerationStep {
  id: string
  label: string
  description: string
  icon: React.ElementType
  status: "pending" | "in_progress" | "completed" | "error"
}

interface GeneratedSiteData {
  siteId: string
  siteName: string
  subdomain: string
  siteUrl: string
  dashboardUrl: string
  managerEmail: string
  managerPassword: string
  themeName: string
  businessName: string
  status: string
}

const GENERATION_STEPS: Omit<GenerationStep, "status">[] = [
  {
    id: "creating_website",
    label: "Creating Website",
    description: "Setting up your website structure and pages",
    icon: Globe,
  },
  {
    id: "configuring_theme",
    label: "Configuring Theme",
    description: "Applying your selected theme template",
    icon: Palette,
  },
  {
    id: "applying_branding",
    label: "Applying Branding",
    description: "Adding your logo, colors, and business identity",
    icon: Building2,
  },
  {
    id: "creating_dashboard",
    label: "Creating Dashboard",
    description: "Setting up your management dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "connecting_database",
    label: "Connecting Database",
    description: "Linking your data and configurations",
    icon: Database,
  },
  {
    id: "finalizing_setup",
    label: "Finalizing Setup",
    description: "Completing final configurations",
    icon: Settings,
  },
  {
    id: "website_ready",
    label: "Website Ready",
    description: "Your website is live and ready to use!",
    icon: CheckCircle2,
  },
]

function GenerateWebsiteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")
  const siteId = searchParams.get("site_id")
  
  const [steps, setSteps] = useState<GenerationStep[]>(
    GENERATION_STEPS.map(step => ({ ...step, status: "pending" }))
  )
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [siteData, setSiteData] = useState<GeneratedSiteData | null>(null)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const updateStepStatus = useCallback((stepId: string, status: GenerationStep["status"]) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }, [])

  const runGeneration = useCallback(async () => {
    if (!sessionId || !siteId) {
      setError("Missing session or site information")
      return
    }

    try {
      // Step 1: Creating Website
      updateStepStatus("creating_website", "in_progress")
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Call the generation API
      const res = await fetch("/api/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, siteId }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to generate website")
      }

      const data = await res.json()
      
      updateStepStatus("creating_website", "completed")
      setCurrentStepIndex(1)

      // Step 2: Configuring Theme
      updateStepStatus("configuring_theme", "in_progress")
      await new Promise(resolve => setTimeout(resolve, 1200))
      updateStepStatus("configuring_theme", "completed")
      setCurrentStepIndex(2)

      // Step 3: Applying Branding
      updateStepStatus("applying_branding", "in_progress")
      await new Promise(resolve => setTimeout(resolve, 1400))
      updateStepStatus("applying_branding", "completed")
      setCurrentStepIndex(3)

      // Step 4: Creating Dashboard
      updateStepStatus("creating_dashboard", "in_progress")
      await new Promise(resolve => setTimeout(resolve, 1100))
      updateStepStatus("creating_dashboard", "completed")
      setCurrentStepIndex(4)

      // Step 5: Connecting Database
      updateStepStatus("connecting_database", "in_progress")
      await new Promise(resolve => setTimeout(resolve, 1300))
      updateStepStatus("connecting_database", "completed")
      setCurrentStepIndex(5)

      // Step 6: Finalizing Setup
      updateStepStatus("finalizing_setup", "in_progress")
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStepStatus("finalizing_setup", "completed")
      setCurrentStepIndex(6)

      // Step 7: Website Ready
      updateStepStatus("website_ready", "in_progress")
      await new Promise(resolve => setTimeout(resolve, 500))
      updateStepStatus("website_ready", "completed")

      setSiteData(data.site)
      setIsComplete(true)

    } catch (err) {
      console.error("Generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate website")
      // Mark current step as error
      const currentStep = steps[currentStepIndex]
      if (currentStep) {
        updateStepStatus(currentStep.id, "error")
      }
    }
  }, [sessionId, siteId, updateStepStatus, currentStepIndex, steps])

  useEffect(() => {
    runGeneration()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const completedSteps = steps.filter(s => s.status === "completed").length
  const progress = (completedSteps / steps.length) * 100

  return (
    <main className="relative min-h-screen bg-background">
      <SpaceBackground />
      <Navbar />
      
      <div className="relative z-10">
        <section className="py-20">
          <div className="container max-w-4xl mx-auto px-4">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
                {isComplete ? (
                  <Rocket className="w-10 h-10 text-primary" />
                ) : (
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {isComplete ? "Your Website is Ready!" : "Generating Your Website"}
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {isComplete 
                  ? "Your professional website has been created and is now live."
                  : "Please wait while we set up your professional website..."}
              </p>
            </motion.div>

            {/* Progress Bar */}
            {!isComplete && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-12"
              >
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 mb-8 text-center"
              >
                <p className="text-destructive font-medium mb-4">{error}</p>
                <Button onClick={() => router.push("/dashboard")} variant="outline">
                  Go to Dashboard
                </Button>
              </motion.div>
            )}

            {/* Steps List */}
            {!isComplete && !error && (
              <div className="space-y-4 mb-12">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = step.status === "in_progress"
                  const isCompleted = step.status === "completed"
                  const isPending = step.status === "pending"

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                        ${isActive ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/10" : ""}
                        ${isCompleted ? "bg-green-500/5 border-green-500/20" : ""}
                        ${isPending ? "bg-card/50 border-border/50 opacity-60" : ""}
                      `}
                    >
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all
                        ${isActive ? "bg-primary/20 text-primary" : ""}
                        ${isCompleted ? "bg-green-500/20 text-green-500" : ""}
                        ${isPending ? "bg-muted text-muted-foreground" : ""}
                      `}>
                        {isActive ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isCompleted ? "text-green-500" : ""}`}>
                          {step.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Success State - Site Details */}
            <AnimatePresence>
              {isComplete && siteData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Website URL Card */}
                  <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Your Website
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Live URL</p>
                        <p className="font-mono text-lg">{siteData.siteUrl}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(siteData.siteUrl, "URL")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => window.open(siteData.siteUrl, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit Site
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Access Card */}
                  <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                      Dashboard Access
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Dashboard URL</p>
                        <p className="font-mono">{siteData.dashboardUrl}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => router.push(siteData.dashboardUrl)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Dashboard
                      </Button>
                    </div>
                  </div>

                  {/* Manager Login Card */}
                  <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Manager Login Credentials
                    </h3>
                    <div className="grid gap-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Email</p>
                            <p className="font-mono">{siteData.managerEmail}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(siteData.managerEmail, "Email")}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Password</p>
                            <p className="font-mono">
                              {showPassword ? siteData.managerPassword : "••••••••••••"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyToClipboard(siteData.managerPassword, "Password")}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-amber-500 mt-4 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Please save these credentials securely. You can change the password later.
                    </p>
                  </div>

                  {/* Site Details Card */}
                  <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Site Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Business Name</p>
                        <p className="font-medium">{siteData.businessName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Theme</p>
                        <p className="font-medium">{siteData.themeName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Subdomain</p>
                        <p className="font-medium">{siteData.subdomain}.mujeebproai.com</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <span className="inline-flex items-center gap-1 text-green-500 font-medium">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Published
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button 
                      size="lg" 
                      className="flex-1 gap-2"
                      onClick={() => router.push(siteData.dashboardUrl)}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Go to Dashboard
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => window.open(siteData.siteUrl, "_blank")}
                    >
                      <Globe className="w-5 h-5" />
                      View Live Website
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
        
        <Footer />
      </div>
    </main>
  )
}

export default function GenerateWebsitePage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    }>
      <GenerateWebsiteContent />
    </Suspense>
  )
}
