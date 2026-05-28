"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  Copy, 
  Rocket, 
  MapPin,
  Eye,
  Building2,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { toast } from "sonner"

interface SiteData {
  id: string
  site_name: string
  subdomain: string
  custom_domain: string | null
  status: string
  theme_name: string
  settings: {
    googleBusiness?: {
      assistedSetup?: boolean
    }
  }
}

function LaunchSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const siteId = searchParams.get("site_id")
  
  const [loading, setLoading] = useState(true)
  const [site, setSite] = useState<SiteData | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const verifyAndActivate = async () => {
      if (!sessionId || !siteId) {
        setError("Missing session or site information")
        setLoading(false)
        return
      }

      try {
        // Verify payment and activate site
        const res = await fetch("/api/themes/verify-launch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, siteId }),
        })

        if (!res.ok) {
          throw new Error("Failed to verify payment")
        }

        const data = await res.json()
        setSite(data.site)
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to verify your payment. Please contact support.")
      } finally {
        setLoading(false)
      }
    }

    verifyAndActivate()
  }, [sessionId, siteId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Activating your website...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/themes">Back to Themes</Link>
            </Button>
            <Button asChild>
              <Link href="/support">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const liveUrl = `https://${site?.subdomain}.mujeebproai.com`
  const dashboardUrl = `/dashboard/sites/${site?.id}`

  return (
    <div className="min-h-screen py-20">
      <div className="container max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Your Website is Live!</h1>
          <p className="text-xl text-muted-foreground">
            Congratulations! {site?.site_name} is now ready for customers
          </p>
        </motion.div>

        {/* Live Website URL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10 mb-8"
        >
          <div className="text-sm text-muted-foreground mb-2">Your Live Website</div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a 
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-bold text-primary hover:underline"
            >
              {site?.subdomain}.mujeebproai.com
            </a>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(liveUrl)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              asChild
            >
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-4 md:grid-cols-2 mb-8"
        >
          <div className="p-6 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="font-bold text-lg">Dashboard</div>
                <div className="text-sm text-muted-foreground">Manage your website</div>
              </div>
            </div>
            <Button className="w-full" asChild>
              <Link href={dashboardUrl}>
                Open Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="font-bold text-lg">View Website</div>
                <div className="text-sm text-muted-foreground">See your live site</div>
              </div>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Website
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Google Business Status */}
        {site?.settings?.googleBusiness?.assistedSetup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 mb-8"
          >
            <div className="flex items-center gap-4">
              <MapPin className="w-8 h-8 text-yellow-400 shrink-0" />
              <div>
                <div className="font-bold text-lg">Google Business Setup Requested</div>
                <p className="text-muted-foreground">
                  Our team will contact you via WhatsApp to help you create and verify your Google Business Profile. 
                  This typically takes 1-2 business days.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Setup Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-xl border border-white/10 bg-white/5 mb-8"
        >
          <div className="font-bold text-lg mb-4">Setup Progress</div>
          <div className="space-y-3">
            {[
              { label: "Website Created", complete: true },
              { label: "Theme Installed", complete: true },
              { label: "Dashboard Ready", complete: true },
              { label: "Add Menu Items", complete: false, link: `${dashboardUrl}/menu` },
              { label: "Upload Photos", complete: false, link: `${dashboardUrl}/gallery` },
              { label: "Configure Payments", complete: false, link: `${dashboardUrl}/payments` },
            ].map((step, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    step.complete ? "bg-green-500/20 text-green-400" : "bg-white/10 text-muted-foreground"
                  }`}>
                    {step.complete ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  <span className={step.complete ? "text-green-400" : ""}>{step.label}</span>
                </div>
                {step.link && !step.complete && (
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={step.link}>
                      Complete
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">
            Need help? Our support team is here for you.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <a href="https://wa.me/447000000000" target="_blank" rel="noopener noreferrer">
                WhatsApp Support
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/support">Help Center</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LaunchSuccessPage() {
  return (
    <main className="relative min-h-screen bg-[#030305]">
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        }>
          <LaunchSuccessContent />
        </Suspense>
        <Footer />
      </div>
    </main>
  )
}
