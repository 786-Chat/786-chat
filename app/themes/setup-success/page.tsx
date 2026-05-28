"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  CheckCircle2, 
  Globe, 
  LayoutDashboard, 
  ExternalLink,
  Copy,
  Check,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { toast } from "sonner"

function SetupSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")
  const siteId = searchParams.get("site_id")
  
  const [loading, setLoading] = useState(true)
  const [siteData, setSiteData] = useState<{
    siteName: string
    subdomain: string
    websiteUrl: string
    adminUrl: string
    email: string
  } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const verifySite = async () => {
      if (!sessionId || !siteId) {
        router.push("/themes")
        return
      }

      try {
        // Verify and activate the site
        const res = await fetch("/api/themes/verify-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, siteId }),
        })

        if (!res.ok) throw new Error("Verification failed")
        
        const data = await res.json()
        setSiteData({
          siteName: data.siteName,
          subdomain: data.subdomain,
          websiteUrl: data.websiteUrl,
          adminUrl: data.adminUrl,
          email: data.email,
        })
      } catch (error) {
        console.error("Verification error:", error)
        toast.error("Failed to verify setup. Please contact support.")
      } finally {
        setLoading(false)
      }
    }

    verifySite()
  }, [sessionId, siteId, router])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Setting up your website...</h2>
          <p className="text-muted-foreground">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (!siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">Please contact support if this persists</p>
          <Button asChild>
            <Link href="/themes">Back to Themes</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl py-12 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-4xl font-bold">Congratulations!</h1>
        <p className="text-xl text-muted-foreground">
          Your website <span className="text-primary font-semibold">{siteData.siteName}</span> is now live!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="p-6 rounded-xl border bg-card space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Your Website
          </h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Website URL</p>
              <a 
                href={siteData.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline flex items-center gap-1"
              >
                {siteData.websiteUrl}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(siteData.websiteUrl, "URL")}
            >
              {copied === "URL" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            Admin Dashboard
          </h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Dashboard URL</p>
              <a 
                href={siteData.adminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline flex items-center gap-1"
              >
                {siteData.adminUrl}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(siteData.adminUrl, "Dashboard URL")}
            >
              {copied === "Dashboard URL" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm">
              <span className="font-semibold">Login with:</span> {siteData.email}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              A temporary password has been sent to your email
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card space-y-4">
          <h3 className="font-semibold text-lg">Next Steps</h3>
          
          <ol className="space-y-3">
            {[
              "Visit your new website and explore the design",
              "Log in to your admin dashboard",
              "Upload your logo and customize branding",
              "Add your menu items and prices",
              "Set up your payment methods",
              "Share your website with customers!",
            ].map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 justify-center"
      >
        <Button variant="outline" size="lg" asChild>
          <a href={siteData.websiteUrl} target="_blank" rel="noopener noreferrer">
            <Globe className="w-4 h-4 mr-2" />
            View Website
          </a>
        </Button>
        <Button size="lg" asChild>
          <a href={siteData.adminUrl}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Go to Dashboard
          </a>
        </Button>
      </motion.div>
    </div>
  )
}

export default function SetupSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <SpaceBackground />
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }>
        <SetupSuccessContent />
      </Suspense>
      <Footer />
    </div>
  )
}
