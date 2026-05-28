"use client"

import { motion } from "framer-motion"
import { Lock, AlertTriangle, CreditCard, Phone, Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface SubscriptionLockScreenProps {
  siteName: string
  lockReason?: string
  gracePeriodEnd?: string
  subscriptionEndDate?: string
  supportEmail?: string
  supportPhone?: string
}

export function SubscriptionLockScreen({
  siteName,
  lockReason = "subscription_expired",
  gracePeriodEnd,
  subscriptionEndDate,
  supportEmail = "support@mujeebproai.com",
  supportPhone = "+44 123 456 7890",
}: SubscriptionLockScreenProps) {
  const isGracePeriod = gracePeriodEnd && new Date(gracePeriodEnd) > new Date()
  const daysRemaining = gracePeriodEnd 
    ? Math.ceil((new Date(gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  const lockMessages: Record<string, { title: string; description: string }> = {
    subscription_expired: {
      title: "Subscription Expired",
      description: "Your subscription has expired. Please renew to continue using your website.",
    },
    payment_failed: {
      title: "Payment Failed",
      description: "We were unable to process your payment. Please update your payment method.",
    },
    manual_lock: {
      title: "Account Suspended",
      description: "Your account has been suspended. Please contact support for assistance.",
    },
    terms_violation: {
      title: "Terms Violation",
      description: "Your account has been suspended due to a violation of our terms of service.",
    },
  }

  const message = lockMessages[lockReason] || lockMessages.subscription_expired

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="border-destructive/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto mb-4 p-4 rounded-full bg-destructive/10"
            >
              <Lock className="w-12 h-12 text-destructive" />
            </motion.div>
            <CardTitle className="text-2xl">{message.title}</CardTitle>
            <CardDescription className="text-base">
              {message.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Site Info */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Website</p>
              <p className="font-semibold">{siteName}</p>
              {subscriptionEndDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Expired: {new Date(subscriptionEndDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Grace Period Warning */}
            {isGracePeriod && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-600 dark:text-yellow-400">
                    Grace Period Active
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have <strong>{daysRemaining} days</strong> remaining to renew before your website data is removed.
                  </p>
                </div>
              </motion.div>
            )}

            {/* What Happens */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                What happens now?
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                  Your website is temporarily offline
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                  Customers cannot access your site
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                  Online ordering is disabled
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  Your data is safely stored
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {(lockReason === "subscription_expired" || lockReason === "payment_failed") && (
                <Button asChild className="w-full gap-2" size="lg">
                  <Link href="/dashboard/billing">
                    <CreditCard className="w-4 h-4" />
                    Renew Subscription
                  </Link>
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" asChild className="gap-2">
                  <a href={`mailto:${supportEmail}`}>
                    <Mail className="w-4 h-4" />
                    Email Support
                  </a>
                </Button>
                <Button variant="outline" asChild className="gap-2">
                  <a href={`tel:${supportPhone}`}>
                    <Phone className="w-4 h-4" />
                    Call Support
                  </a>
                </Button>
              </div>
            </div>

            {/* Support Info */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>Need help? Contact us:</p>
              <p className="font-medium">{supportEmail}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
