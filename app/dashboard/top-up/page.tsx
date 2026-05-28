"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js"
import { ArrowLeft, Zap, Check, Sparkles, CreditCard, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CREDIT_PACKAGES, calculateOrderTotal } from "@/lib/credit-packages"
import { startCreditsCheckout } from "@/app/actions/credits-checkout"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function TopUpPage() {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const selectedCredit = CREDIT_PACKAGES.find((p) => p.id === selectedPackage)
  const totals = selectedCredit ? calculateOrderTotal(selectedCredit.priceInCents) : null

  const fetchClientSecret = useCallback(async () => {
    if (!selectedPackage) throw new Error("No package selected")
    return startCreditsCheckout(selectedPackage)
  }, [selectedPackage])

  const handleComplete = useCallback(() => {
    setIsComplete(true)
    // Redirect after a delay
    setTimeout(() => {
      router.push("/dashboard?topup=success")
    }, 3000)
  }, [router])

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Card className="bg-[#14141f] border-white/10 max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-white/60 mb-4">
              {selectedCredit?.credits} credits have been added to your account.
            </p>
            <p className="text-sm text-white/40">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => showCheckout ? setShowCheckout(false) : router.back()}
            className="text-white/60 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-white">MujeebProAI Credits</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!showCheckout ? (
          // Package Selection
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Add Credits</h1>
              <p className="text-white/60">
                Purchase credits to use MujeebProAI features
              </p>
            </div>

            {/* Credit Packages */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={cn(
                    "relative p-6 rounded-xl border-2 transition-all text-left",
                    selectedPackage === pkg.id
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  )}
                >
                  {pkg.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={cn(
                      "w-5 h-5",
                      selectedPackage === pkg.id ? "text-cyan-400" : "text-white/40"
                    )} />
                    <span className={cn(
                      "text-2xl font-bold",
                      selectedPackage === pkg.id ? "text-white" : "text-white/80"
                    )}>
                      {pkg.credits}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm",
                    selectedPackage === pkg.id ? "text-white/80" : "text-white/50"
                  )}>
                    credits
                  </p>
                  <p className={cn(
                    "text-xl font-semibold mt-3",
                    selectedPackage === pkg.id ? "text-cyan-400" : "text-white/70"
                  )}>
                    ${(pkg.priceInCents / 100).toFixed(2)}
                  </p>
                </button>
              ))}
            </div>

            {/* Order Summary */}
            {selectedCredit && totals && (
              <Card className="bg-[#14141f] border-white/10 mb-6">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">{selectedCredit.credits} MujeebProAI Credits</span>
                      <span className="text-white">${(totals.subtotal / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Processing Fee</span>
                      <span className="text-white">${(totals.processingFee / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Estimated Tax</span>
                      <span className="text-white">${(totals.tax / 100).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-xl font-bold text-cyan-400">
                          ${(totals.total / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Continue Button */}
            <Button
              onClick={() => setShowCheckout(true)}
              disabled={!selectedPackage}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium text-lg disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Continue to Payment
            </Button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-6 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
                <span>Powered by Stripe</span>
              </div>
            </div>
          </div>
        ) : (
          // Stripe Checkout
          <div className="max-w-2xl mx-auto">
            <Card className="bg-[#14141f] border-white/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                  <h2 className="text-lg font-semibold text-white">Payment Details</h2>
                  <p className="text-sm text-white/60">
                    {selectedCredit?.credits} Credits - ${totals ? (totals.total / 100).toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="bg-white rounded-b-lg">
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{
                      clientSecret: fetchClientSecret,
                      onComplete: handleComplete,
                    }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
