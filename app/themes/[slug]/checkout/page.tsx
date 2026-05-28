"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import { 
  Loader2, 
  Check, 
  Shield, 
  CreditCard,
  ArrowLeft,
  Star,
  Palette
} from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Theme {
  id: string
  name: string
  slug: string
  description: string
  price_cents: number
  currency: string
  thumbnail_url: string
  category_name: string
  features: string[]
  is_featured: boolean
}

export default function ThemeCheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [siteName, setSiteName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [step, setStep] = useState<"details" | "payment">("details")
  const [error, setError] = useState<string | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)

  // Fetch theme details
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch(`/api/themes/${params.slug}`)
        if (res.ok) {
          const data = await res.json()
          setTheme(data.theme)
        } else {
          setError("Theme not found")
        }
      } catch {
        setError("Failed to load theme")
      } finally {
        setIsLoading(false)
      }
    }
    fetchTheme()
  }, [params.slug])

  // Check subdomain availability
  const checkSubdomain = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setSubdomainAvailable(null)
      return
    }
    
    setCheckingSubdomain(true)
    try {
      const res = await fetch(`/api/customer/check-subdomain?subdomain=${encodeURIComponent(value)}`)
      const data = await res.json()
      setSubdomainAvailable(data.available)
    } catch {
      setSubdomainAvailable(null)
    } finally {
      setCheckingSubdomain(false)
    }
  }, [])

  // Debounce subdomain check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (subdomain) {
        checkSubdomain(subdomain)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [subdomain, checkSubdomain])

  // Create checkout session
  const handleProceedToPayment = async () => {
    if (!siteName || !subdomain || !subdomainAvailable) {
      setError("Please fill in all fields and ensure subdomain is available")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch("/api/themes/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          themeId: theme?.id,
          siteName,
          subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create checkout session")
      }

      const data = await res.json()
      setClientSecret(data.clientSecret)
      setStep("payment")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to proceed to payment")
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/themes/${params.slug}/checkout`)
    }
  }, [authLoading, user, router, params.slug])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !theme) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{error}</h1>
          <Button onClick={() => router.push("/themes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Themes
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  if (!theme) return null

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
    }).format(cents / 100)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => step === "payment" ? setStep("details") : router.push(`/themes/${params.slug}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === "payment" ? "Back to Details" : "Back to Theme"}
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Checkout Form */}
          <div>
            {step === "details" ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl">Create Your Website</CardTitle>
                  <CardDescription>
                    Set up your new website with the {theme.name} theme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Website Name</Label>
                    <Input
                      id="siteName"
                      placeholder="My Amazing Restaurant"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be displayed as your website title
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Choose Your URL</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="subdomain"
                        placeholder="my-restaurant"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        className="bg-background/50"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        .mujeebproai.com
                      </span>
                    </div>
                    {checkingSubdomain && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Checking availability...
                      </p>
                    )}
                    {!checkingSubdomain && subdomainAvailable === true && (
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        This URL is available!
                      </p>
                    )}
                    {!checkingSubdomain && subdomainAvailable === false && (
                      <p className="text-xs text-red-500">
                        This URL is already taken. Please choose another.
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                      {error}
                    </p>
                  )}

                  <Button 
                    onClick={handleProceedToPayment}
                    disabled={!siteName || !subdomain || !subdomainAvailable || isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Proceed to Payment - {formatPrice(theme.price_cents, theme.currency)}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Secure Payment
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      Powered by Stripe
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl">Complete Payment</CardTitle>
                  <CardDescription>
                    Secure payment powered by Stripe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientSecret && (
                    <EmbeddedCheckoutProvider
                      stripe={stripePromise}
                      options={{ clientSecret }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Preview */}
                <div className="flex gap-4">
                  {theme.thumbnail_url ? (
                    <img 
                      src={theme.thumbnail_url} 
                      alt={theme.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Palette className="w-8 h-8 text-primary/50" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{theme.name}</h3>
                      {theme.is_featured && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{theme.category_name}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {theme.description}
                    </p>
                  </div>
                </div>

                {/* Features */}
                {theme.features && theme.features.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Includes:</p>
                    <ul className="space-y-1">
                      {theme.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Site Details */}
                {siteName && (
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-sm font-medium text-foreground mb-2">Your Website:</p>
                    <p className="text-sm text-muted-foreground">{siteName}</p>
                    {subdomain && (
                      <p className="text-xs text-primary mt-1">
                        {subdomain}.mujeebproai.com
                      </p>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Theme Price</span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(theme.price_cents, theme.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(theme.price_cents, theme.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    One-time payment. No recurring fees.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
