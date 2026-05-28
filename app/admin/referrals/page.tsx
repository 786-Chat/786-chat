"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Gift, 
  Plus, 
  Loader2, 
  Copy, 
  Check, 
  Trash2, 
  Users,
  PoundSterling,
  CheckCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ReferralCode {
  id: string
  code: string
  referrer_name: string
  referrer_email: string | null
  referrer_mobile: string | null
  discount_amount: number
  commission_per_customer: number
  is_active: boolean
  created_at: string
  commission?: {
    total: number
    paid: number
    unpaid: number
  }
}

interface ReferralUsage {
  id: string
  customer_email: string
  discount_applied: number
  commission_earned: number
  is_paid: boolean
  created_at: string
  referrer_name: string
  code: string
}

export default function AdminReferralsPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [usages, setUsages] = useState<ReferralUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"codes" | "usages">("codes")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newReferrer, setNewReferrer] = useState({
    name: "",
    email: "",
    mobile: "",
    discount: 2,
    commission: 1
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === "codes") {
        const res = await fetch("/api/admin/referrals?type=codes")
        const data = await res.json()
        setCodes(data.codes || [])
      } else {
        const res = await fetch("/api/admin/referrals?type=usages")
        const data = await res.json()
        setUsages(data.usages || [])
      }
    } catch (error) {
      console.error("Failed to fetch:", error)
    } finally {
      setLoading(false)
    }
  }

  const createCode = async () => {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          referrerName: newReferrer.name,
          referrerEmail: newReferrer.email,
          referrerMobile: newReferrer.mobile,
          discountAmount: newReferrer.discount,
          commissionPerCustomer: newReferrer.commission
        })
      })
      if (res.ok) {
        setDialogOpen(false)
        setNewReferrer({ name: "", email: "", mobile: "", discount: 2, commission: 1 })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create code:", error)
    }
  }

  const deleteCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this referral code?")) return
    try {
      await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", codeId })
      })
      fetchData()
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const markPaid = async (usageId: string) => {
    try {
      await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markPaid", usageId })
      })
      fetchData()
    } catch (error) {
      console.error("Failed to mark paid:", error)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <Gift className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Referral Management</h1>
            <p className="text-muted-foreground text-sm">Create and manage referral codes</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Referrer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Referrer</DialogTitle>
              <DialogDescription>Create a referral code for a new partner</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Referrer Name *</Label>
                <Input
                  placeholder="e.g., Zubair"
                  value={newReferrer.name}
                  onChange={(e) => setNewReferrer({ ...newReferrer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="zubair@example.com"
                  value={newReferrer.email}
                  onChange={(e) => setNewReferrer({ ...newReferrer, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input
                  placeholder="+44 7123 456789"
                  value={newReferrer.mobile}
                  onChange={(e) => setNewReferrer({ ...newReferrer, mobile: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Discount (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newReferrer.discount}
                    onChange={(e) => setNewReferrer({ ...newReferrer, discount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Commission per Customer (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newReferrer.commission}
                    onChange={(e) => setNewReferrer({ ...newReferrer, commission: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={createCode} disabled={!newReferrer.name} className="w-full">
                Create Referral Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "codes" ? "default" : "outline"}
          onClick={() => setActiveTab("codes")}
        >
          <Gift className="w-4 h-4 mr-2" />
          Referral Codes
        </Button>
        <Button
          variant={activeTab === "usages" ? "default" : "outline"}
          onClick={() => setActiveTab("usages")}
        >
          <Users className="w-4 h-4 mr-2" />
          Customer Usage
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : activeTab === "codes" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {codes.map((code) => (
            <Card key={code.id} className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{code.referrer_name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => deleteCode(code.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  {code.referrer_email || "No email"} | {code.referrer_mobile || "No mobile"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <code className="flex-1 font-mono text-cyan-400">{code.code}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyCode(code.code)}
                  >
                    {copiedCode === code.code ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <p className="text-purple-400 font-medium">Discount</p>
                    <p className="text-lg font-bold">£{code.discount_amount}</p>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <p className="text-green-400 font-medium">Commission</p>
                    <p className="text-lg font-bold">£{code.commission_per_customer}/customer</p>
                  </div>
                </div>
                {code.commission && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <PoundSterling className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">Earnings</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-bold">£{code.commission.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-bold text-green-400">£{code.commission.paid.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unpaid</p>
                        <p className="font-bold text-orange-400">£{code.commission.unpaid.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {codes.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No referral codes yet. Click "Add Referrer" to create one.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {usages.map((usage) => (
            <Card key={usage.id} className="bg-card/50 border-border/50">
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-medium">{usage.customer_email}</p>
                  <p className="text-sm text-muted-foreground">
                    Used code <span className="text-cyan-400 font-mono">{usage.code}</span> from {usage.referrer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(usage.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="font-bold text-green-400">£{usage.commission_earned}</p>
                  </div>
                  {usage.is_paid ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Paid</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markPaid(usage.id)}
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {usages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No referral usages yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
