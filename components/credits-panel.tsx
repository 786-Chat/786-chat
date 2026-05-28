"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Coins, 
  Zap, 
  TrendingUp, 
  MessageCircle, 
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BalanceData {
  balance: number
  freeMessagesUsed: number
  freeMessagesLimit: number
  freeMessagesRemaining: number
  totalMessagesSent: number
  totalSpent: number
  pricing: {
    costPerMessage: number
    costPer1000Messages: number
    topupAmounts: number[]
  }
}

export function CreditsPanel() {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [topupOpen, setTopupOpen] = useState(false)
  const [processing, setProcessing] = useState<number | null>(null)

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/balance")
      if (res.ok) {
        const data = await res.json()
        setBalance(data)
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopup = async (amount: number) => {
    setProcessing(amount)
    try {
      const res = await fetch("/api/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })

      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
      } else {
        alert("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Top-up error:", error)
      alert("Failed to process top-up")
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/10">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </CardContent>
      </Card>
    )
  }

  if (!balance) return null

  const freePercentage = (balance.freeMessagesUsed / balance.freeMessagesLimit) * 100
  const hasFreeMsgs = balance.freeMessagesRemaining > 0
  const lowBalance = !hasFreeMsgs && balance.balance < 0.10

  return (
    <>
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Coins className="w-5 h-5 text-amber-400" />
              AI Credits
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setTopupOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Add Credits
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Balance</div>
              <div className="text-xl font-bold text-white">${balance.balance.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Cost/Message</div>
              <div className="text-xl font-bold text-white">${balance.pricing.costPerMessage.toFixed(4)}</div>
            </div>
          </div>

          {/* Free Messages Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Free Messages</span>
              <span className="text-white font-medium">
                {balance.freeMessagesRemaining} / {balance.freeMessagesLimit}
              </span>
            </div>
            <Progress value={freePercentage} className="h-2 bg-white/10" />
            {hasFreeMsgs ? (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {balance.freeMessagesRemaining} free messages remaining
              </p>
            ) : (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Free messages used - using paid credits
              </p>
            )}
          </div>

          {/* Low Balance Warning */}
          {lowBalance && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300">Low Balance</p>
                  <p className="text-xs text-red-300/70 mt-0.5">
                    Add credits to continue using AI features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/10">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {balance.totalMessagesSent} total messages
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              ${balance.totalSpent.toFixed(2)} spent
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Top-up Dialog */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              Add AI Credits
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Select an amount to add to your balance
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 pt-4">
            {[5, 10, 20, 50].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-1 bg-white/5 border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
                onClick={() => handleTopup(amount)}
                disabled={processing !== null}
              >
                {processing === amount ? (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                ) : (
                  <>
                    <span className="text-2xl font-bold text-white">${amount}</span>
                    <span className="text-xs text-white/50">
                      ~{Math.floor(amount / balance.pricing.costPerMessage).toLocaleString()} messages
                    </span>
                  </>
                )}
              </Button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Current Balance</span>
              <span className="text-white font-medium">${balance.balance.toFixed(2)}</span>
            </div>
            <p className="text-xs text-white/40 mt-2">
              Credits are added instantly after payment. Secure checkout powered by Stripe.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
