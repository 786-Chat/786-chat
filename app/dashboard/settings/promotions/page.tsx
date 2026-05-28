"use client"

import { useState } from "react"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { motion } from "framer-motion"
import {
  Gift,
  Copy,
  Check,
  Users,
  Zap,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function PromotionsPage() {
  const [copied, setCopied] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const referralCode = "MUJEEB-PRO-XK7J9"
  const referralLink = `https://mujeebproai.com/signup?ref=${referralCode}`

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const referralStats = {
    invitesSent: 5,
    signups: 2,
    creditsEarned: 20,
  }

  const promotions = [
    {
      title: "Early Adopter Bonus",
      description: "Get 50 free credits for being an early user",
      credits: 50,
      status: "claimed",
    },
    {
      title: "First Purchase Bonus",
      description: "20% extra credits on your first purchase",
      credits: 0,
      status: "available",
    },
  ]

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Promotions & Referrals</h1>
          <p className="text-muted-foreground">Earn credits by inviting friends</p>
        </motion.div>

        {/* Referral Program */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Referral Program
              </CardTitle>
              <CardDescription>
                Invite friends and earn 10 credits for each signup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your Referral Link</Label>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="bg-muted" />
                  <Button onClick={() => handleCopy(referralLink)} variant="outline">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Your Referral Code</Label>
                <div className="flex gap-2">
                  <Input value={referralCode} readOnly className="bg-muted font-mono" />
                  <Button onClick={() => handleCopy(referralCode)} variant="outline">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">{referralStats.invitesSent}</p>
                <p className="text-xs text-muted-foreground">Invites Sent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{referralStats.signups}</p>
                <p className="text-xs text-muted-foreground">Signups</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{referralStats.creditsEarned}</p>
                <p className="text-xs text-muted-foreground">Credits Earned</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Redeem Promo Code */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Redeem Promo Code</CardTitle>
              <CardDescription>Enter a promotional code to receive credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter promo code" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button disabled={!promoCode}>Redeem</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Promotions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Available Promotions</CardTitle>
              <CardDescription>Special offers and bonuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {promotions.map((promo, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    promo.status === "claimed" ? "bg-muted/50 border-muted" : "bg-primary/5 border-primary/20"
                  )}
                >
                  <div>
                    <p className="font-medium text-sm">{promo.title}</p>
                    <p className="text-xs text-muted-foreground">{promo.description}</p>
                  </div>
                  {promo.status === "claimed" ? (
                    <span className="text-xs text-muted-foreground">Claimed</span>
                  ) : (
                    <Button size="sm" variant="outline">
                      Claim
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SettingsLayout>
  )
}
