"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { motion } from "framer-motion"
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  Building,
  Loader2,
  Download,
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfect for trying out",
    icon: Zap,
    features: ["20 AI generations/month", "3 private projects", "Preview builds", "Code and visual editing"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 20,
    description: "For professionals",
    icon: Crown,
    features: ["500 AI generations/month", "20 projects", "20 deployments/month", "3 custom domains"],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 40,
    description: "For teams",
    icon: Building,
    features: ["3,000 AI generations/month", "100 projects", "200 deployments/month", "20 domains and 10 members"],
    popular: false,
  },
]

interface Invoice {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "failed"
  downloadUrl?: string
}

interface PaymentMethod {
  type: "card"
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export default function BillingPage() {
  const { user, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [subscription, setSubscription] = useState<{
    messages_used: number
    messages_limit: number
    extra_credits: number
    plan: string
    status?: string
    current_period_end?: string
  } | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [billingError, setBillingError] = useState("")

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccessDialog(true)
      refreshUser()
      window.history.replaceState({}, "", "/dashboard/billing")
    } else if (searchParams.get("canceled") === "true") {
      setShowCancelDialog(true)
      window.history.replaceState({}, "", "/dashboard/billing")
    }
    
    fetchSubscription()
    fetchInvoices()
  }, [searchParams, refreshUser])

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/user/subscription", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/user/payments", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.payments?.map((p: { id: string; created_at: string; amount: number; status: string }) => ({
          id: p.id,
          date: p.created_at,
          amount: p.amount,
          status: p.status === "completed" ? "paid" : p.status
        })) || [])
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    }
  }

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return
    setBillingError("")
    setIsUpgrading(planId)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "subscription", planId })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setBillingError(data.error || "Checkout could not be started.")
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setIsUpgrading(null)
    }
  }

  const handleCredits = async (packageId: "small" | "medium" | "large") => {
    setIsUpgrading(`credits-${packageId}`)
    setBillingError("")
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "credits", packageId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setBillingError(data.error || "Credit checkout could not be started.")
    } catch {
      setBillingError("Credit checkout could not be started.")
    } finally {
      setIsUpgrading(null)
    }
  }

  const handleManageBilling = async () => {
    setIsLoadingPortal(true)
    setBillingError("")
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include"
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setBillingError(data.error || "The billing portal could not be opened.")
      }
    } catch (error) {
      console.error("Portal error:", error)
    } finally {
      setIsLoadingPortal(false)
    }
  }

  const rawPlan = String(subscription?.plan || user?.plan || "free").toLowerCase()
  const normalizedPlan = rawPlan === "business" || rawPlan === "enterprise"
    ? "business"
    : rawPlan === "pro" || rawPlan === "basic"
      ? "pro"
      : "free"
  const currentPlan = plans.find(p => p.id === normalizedPlan)
  const messagesUsed = subscription?.messages_used || 0
  const messagesLimit = subscription?.messages_limit || 20

  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-6 h-6" />
                Payment Successful!
              </DialogTitle>
              <DialogDescription>
                Your payment has been processed successfully. Your account has been updated.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setShowSuccessDialog(false)} className="w-full">
              Continue
            </Button>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-yellow-500">
                <XCircle className="w-6 h-6" />
                Payment Canceled
              </DialogTitle>
              <DialogDescription>
                Your payment was canceled. No charges were made.
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="w-full">
              Close
            </Button>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and payment methods</p>
        </motion.div>

        {billingError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {billingError}
          </div>
        )}

        {/* Current Plan Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your active subscription</CardDescription>
                </div>
                <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
                  {subscription?.status || "Active"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 mb-4">
                <div className="flex items-center gap-4">
                  {currentPlan && (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <currentPlan.icon className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{currentPlan?.name || "Starter"} Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      £{currentPlan?.price || 0}/month
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="font-semibold">{messagesUsed} / {messagesLimit}</p>
                  <p className="text-xs text-muted-foreground">{subscription?.extra_credits || 0} extra credits</p>
                </div>
              </div>
              
              {subscription?.current_period_end && (
                <p className="text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleManageBilling} disabled={isLoadingPortal}>
                  {isLoadingPortal && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage in Stripe
                </Button>
                {normalizedPlan !== "business" && (
                  <Button onClick={() => handleUpgrade("pro")}>
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Plans */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>Choose the plan that fits your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isCurrentPlan = normalizedPlan === plan.id
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative p-4 rounded-xl border transition-all",
                        plan.popular && "border-primary shadow-sm",
                        isCurrentPlan && "border-green-500/50 bg-green-500/5"
                      )}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          Popular
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <plan.icon className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">{plan.name}</h4>
                      </div>
                      <div className="mb-3">
                        <span className="text-2xl font-bold">£{plan.price}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                      <ul className="space-y-1.5 mb-4 text-sm">
                        {plan.features.slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant={isCurrentPlan ? "secondary" : plan.popular ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        disabled={isCurrentPlan || isUpgrading === plan.id || plan.price === 0}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {isUpgrading === plan.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isCurrentPlan ? "Current" : plan.price === 0 ? "Free" : "Select"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>Extra AI credits</CardTitle>
              <CardDescription>Credits are used only after the monthly plan allowance is reached.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {[
                { id: "small" as const, credits: 50, price: 5 },
                { id: "medium" as const, credits: 150, price: 12 },
                { id: "large" as const, credits: 500, price: 35 },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className="h-auto justify-between px-4 py-4"
                  disabled={isUpgrading === `credits-${item.id}`}
                  onClick={() => handleCredits(item.id)}
                >
                  <span>{item.credits} credits</span>
                  <span>£{item.price}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Invoice History */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>Your past invoices and payments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No invoices yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          {new Date(invoice.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          £{invoice.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            invoice.status === "paid" ? "default" :
                            invoice.status === "pending" ? "secondary" : "destructive"
                          }>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Method */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethod ? (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">{paymentMethod.brand} **** {paymentMethod.last4}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageBilling}>
                    Update
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg border border-dashed">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-muted-foreground/50" />
                    <div>
                      <p className="font-medium">No payment method</p>
                      <p className="text-sm text-muted-foreground">Add a payment method to upgrade</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageBilling}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SettingsLayout>
  )
}
