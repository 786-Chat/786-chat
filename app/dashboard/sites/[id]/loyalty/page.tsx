"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Gift, 
  Users, 
  Trophy, 
  Coins, 
  Settings,
  Loader2,
  Search,
  Star,
  Crown,
  Medal
} from "lucide-react"
import { toast } from "sonner"

interface LoyaltyProgram {
  id: string
  is_enabled: boolean
  points_per_pound: number
  points_value_pence: number
  welcome_bonus: number
  referral_bonus: number
  birthday_bonus: number
  minimum_redeem: number
}

interface LoyaltyMember {
  id: string
  customer_email: string
  customer_name: string
  customer_phone: string
  points_balance: number
  total_points_earned: number
  total_points_redeemed: number
  tier: string
  joined_at: string
  last_activity_at: string
}

export default function LoyaltyPage() {
  const params = useParams()
  const siteId = params.id as string
  const [program, setProgram] = useState<LoyaltyProgram | null>(null)
  const [members, setMembers] = useState<LoyaltyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchData()
  }, [siteId])

  const fetchData = async () => {
    try {
      const [programRes, membersRes] = await Promise.all([
        fetch(`/api/customer/sites/${siteId}/loyalty/program`),
        fetch(`/api/customer/sites/${siteId}/loyalty/members`)
      ])
      
      if (programRes.ok) {
        const data = await programRes.json()
        setProgram(data.program)
      }
      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProgram = async () => {
    if (!program) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/loyalty/program`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program)
      })
      if (res.ok) {
        toast.success("Loyalty program settings saved")
      }
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "gold": return <Crown className="w-4 h-4 text-yellow-500" />
      case "silver": return <Medal className="w-4 h-4 text-gray-400" />
      default: return <Star className="w-4 h-4 text-amber-700" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold": return "bg-yellow-500/10 text-yellow-600"
      case "silver": return "bg-gray-500/10 text-gray-600"
      default: return "bg-amber-500/10 text-amber-700"
    }
  }

  const filteredMembers = members.filter(m =>
    m.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.customer_email.toLowerCase().includes(search.toLowerCase())
  )

  const totalPointsIssued = members.reduce((acc, m) => acc + m.total_points_earned, 0)
  const totalPointsRedeemed = members.reduce((acc, m) => acc + m.total_points_redeemed, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Loyalty Program</h1>
        <p className="text-muted-foreground">Reward your customers with points and special offers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Coins className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points Issued</p>
                <p className="text-2xl font-bold">{totalPointsIssued.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Gift className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points Redeemed</p>
                <p className="text-2xl font-bold">{totalPointsRedeemed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gold Members</p>
                <p className="text-2xl font-bold">{members.filter(m => m.tier === "gold").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Program Settings</CardTitle>
                  <CardDescription>Configure how customers earn and redeem points</CardDescription>
                </div>
                {program && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="enabled">Program Enabled</Label>
                    <Switch
                      id="enabled"
                      checked={program.is_enabled}
                      onCheckedChange={(checked) => setProgram({ ...program, is_enabled: checked })}
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {program && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Points per Pound Spent</Label>
                      <Input
                        type="number"
                        value={program.points_per_pound}
                        onChange={(e) => setProgram({ ...program, points_per_pound: parseFloat(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">How many points customers earn per GBP spent</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Point Value (pence)</Label>
                      <Input
                        type="number"
                        value={program.points_value_pence}
                        onChange={(e) => setProgram({ ...program, points_value_pence: parseFloat(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">How much each point is worth when redeemed</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Points to Redeem</Label>
                      <Input
                        type="number"
                        value={program.minimum_redeem}
                        onChange={(e) => setProgram({ ...program, minimum_redeem: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">Minimum points required before redemption</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Welcome Bonus Points</Label>
                      <Input
                        type="number"
                        value={program.welcome_bonus}
                        onChange={(e) => setProgram({ ...program, welcome_bonus: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">Points given when a new member joins</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Referral Bonus Points</Label>
                      <Input
                        type="number"
                        value={program.referral_bonus}
                        onChange={(e) => setProgram({ ...program, referral_bonus: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">Points given for referring a friend</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Birthday Bonus Points</Label>
                      <Input
                        type="number"
                        value={program.birthday_bonus}
                        onChange={(e) => setProgram({ ...program, birthday_bonus: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">Points given on member&apos;s birthday</p>
                    </div>
                  </div>
                  <Button onClick={handleSaveProgram} disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Loyalty Members</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No members yet</h3>
                  <p className="text-muted-foreground">Customers will appear here when they join your loyalty program</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Member</th>
                        <th className="text-left py-3 px-4 font-medium">Tier</th>
                        <th className="text-right py-3 px-4 font-medium">Balance</th>
                        <th className="text-right py-3 px-4 font-medium">Total Earned</th>
                        <th className="text-right py-3 px-4 font-medium">Total Redeemed</th>
                        <th className="text-left py-3 px-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{member.customer_name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{member.customer_email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getTierColor(member.tier)}>
                              {getTierIcon(member.tier)}
                              <span className="ml-1 capitalize">{member.tier}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {member.points_balance.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {member.total_points_earned.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {member.total_points_redeemed.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
