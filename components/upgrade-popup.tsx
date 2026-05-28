"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Zap, Check, Crown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BILLING_PLANS, CURRENCY_SYMBOLS, type Currency, type PlanId } from "@/lib/billing"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface UpgradePopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currency?: Currency
}

export function UpgradePopup({ open, onOpenChange, currency = "GBP" }: UpgradePopupProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro")
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async (planId: PlanId) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
        credentials: "include",
      })

      if (response.ok) {
        onOpenChange(false)
        router.push("/dashboard/billing?upgraded=true")
      }
    } catch (error) {
      console.error("Upgrade error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const plans = Object.entries(BILLING_PLANS).filter(([id]) => id !== "starter") as [PlanId, typeof BILLING_PLANS.basic][]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#14141f] rounded-2xl border border-cyan-500/30 p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 mb-4"
              >
                <Crown className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Upgrade Your Plan
              </h2>
              <p className="text-white/60 max-w-md mx-auto">
                You&apos;ve used all your free messages. Upgrade to continue using MujeebProAI.
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {plans.map(([planId, plan]) => {
                const price = plan.price[currency]
                const symbol = CURRENCY_SYMBOLS[currency]
                const isSelected = selectedPlan === planId

                return (
                  <motion.div
                    key={planId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedPlan(planId)}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-white/10 hover:border-white/30 bg-white/5"
                    } ${plan.isPopular ? "ring-2 ring-cyan-500" : ""}`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-xs font-medium text-white">
                        Most Popular
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      {plan.isPopular ? (
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <Zap className="w-5 h-5 text-cyan-400" />
                      )}
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                    </div>

                    <div className="mb-3">
                      <span className="text-2xl font-bold text-white">{symbol}{price}</span>
                      <span className="text-white/50 text-sm">/month</span>
                    </div>

                    <p className="text-sm text-cyan-400 mb-3">
                      {plan.messagesIncluded.toLocaleString()} messages/month
                    </p>

                    <ul className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                          <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isSelected && (
                      <motion.div
                        layoutId="selected-plan"
                        className="absolute inset-0 border-2 border-cyan-500 rounded-xl pointer-events-none"
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl"
              >
                {isLoading ? "Processing..." : `Upgrade to ${BILLING_PLANS[selectedPlan].name}`}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="px-8 py-3 border-white/20 text-white hover:bg-white/10"
              >
                Maybe Later
              </Button>
            </div>

            {/* Security Badge */}
            <p className="text-center text-xs text-white/40 mt-4">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
