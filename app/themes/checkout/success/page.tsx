"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { 
  Loader2, 
  CheckCircle, 
  ArrowRight, 
  ExternalLink,
  Sparkles
} from "lucide-react"
import confetti from "canvas-confetti"

interface PurchaseDetails {
  siteName: string
  subdomain: string
  themeName: string
  siteId: string
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    
    if (!sessionId) {
      setError("No session ID provided")
      setIsVerifying(false)
      return
    }

    const verifyPurchase = async () => {
      try {
        const res = await fetch(`/api/themes/verify-purchase?session_id=${sessionId}`, {
          credentials: "include",
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Verification failed")
        }

        const data = await res.json()
        setPurchaseDetails(data)

        // Fire confetti on success
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify purchase")
      } finally {
        setIsVerifying(false)
      }
    }

    verifyPurchase()
  }, [searchParams])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your purchase...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/themes")}>
            Browse Themes
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Purchase Successful!
              </h1>
              <p className="text-muted-foreground">
                Your website has been created and is ready to customize
              </p>
            </div>

            <CardContent className="p-8 space-y-6">
              {purchaseDetails && (
                <>
                  {/* Site Details */}
                  <div className="bg-background/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Website Name</span>
                      <span className="font-medium text-foreground">{purchaseDetails.siteName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Theme</span>
                      <span className="font-medium text-foreground">{purchaseDetails.themeName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Your URL</span>
                      <a 
                        href={`https://${purchaseDetails.subdomain}.mujeebproai.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {purchaseDetails.subdomain}.mujeebproai.com
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Next Steps
                    </h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                        Go to your dashboard to customize your website
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                        Add your business details, logo, and content
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                        Preview your site and publish when ready
                      </li>
                    </ol>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      onClick={() => router.push(`/dashboard/sites/${purchaseDetails.siteId}/builder`)}
                      className="flex-1"
                      size="lg"
                    >
                      Customize Your Site
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push("/dashboard/sites")}
                      className="flex-1"
                      size="lg"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
