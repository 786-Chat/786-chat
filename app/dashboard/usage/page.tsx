"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { motion } from "framer-motion"
import {
  Zap,
  Calendar,
  AlertCircle,
  TrendingUp,
  Plus,
  Download,
  ChevronDown,
  MessageSquare,
  FileImage,
  FileText,
  Globe,
  HardDrive,
  Cpu,
  Database
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface UsageData {
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  resetDate: string
  alertAmount: number
  budgetAmount: number
  monthlyCharges: number
}

interface ResourceUsage {
  category: string
  item: string
  usage: number
  unit: string
  unitPrice: number
  cost: number
  icon: React.ElementType
}

const creditPacks = [
  { id: "small", credits: 50, price: 5, discount: 0 },
  { id: "medium", credits: 150, price: 12, discount: 5 },
  { id: "large", credits: 500, price: 35, discount: 10 },
  { id: "xlarge", credits: 1000, price: 60, discount: 15 },
]

export default function AccountUsagePage() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [selectedMonth, setSelectedMonth] = useState("current")
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)

  useEffect(() => {
    fetchUsage()
  }, [selectedMonth])

  const fetchUsage = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/usage?month=${selectedMonth}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setUsage(data)
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchaseCredits = async (packId: string) => {
    setIsPurchasing(true)
    try {
      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packId })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Purchase error:", error)
    } finally {
      setIsPurchasing(false)
    }
  }

  // Mock resource usage data - in real app, fetch from API
  const resourceUsage: ResourceUsage[] = [
    { category: "AI", item: "Claude Messages", usage: usage?.usedCredits || 0, unit: "messages", unitPrice: 0.10, cost: (usage?.usedCredits || 0) * 0.10, icon: MessageSquare },
    { category: "AI", item: "AI Agent Usage", usage: 0, unit: "minutes", unitPrice: 0.02, cost: 0, icon: Cpu },
    { category: "AI", item: "File/Image Processing", usage: 12, unit: "files", unitPrice: 0.01, cost: 0.12, icon: FileImage },
    { category: "AI", item: "PDF Processing", usage: 5, unit: "pages", unitPrice: 0.005, cost: 0.025, icon: FileText },
    { category: "App", item: "Published Apps", usage: 1, unit: "apps", unitPrice: 0, cost: 0, icon: Globe },
    { category: "App", item: "Outbound Data Transfer", usage: 0.5, unit: "GB", unitPrice: 0.15, cost: 0.075, icon: TrendingUp },
    { category: "App", item: "Compute Usage", usage: 2.5, unit: "hours", unitPrice: 0.05, cost: 0.125, icon: Cpu },
    { category: "App", item: "Storage Usage", usage: 0.1, unit: "GB", unitPrice: 0.10, cost: 0.01, icon: Database },
  ]

  const totalCost = resourceUsage.reduce((sum, r) => sum + r.cost, 0)

  const usedCredits = usage?.usedCredits || 0
  const totalCredits = usage?.totalCredits || (user?.plan === "starter" ? 5 : user?.plan === "basic" ? 100 : user?.plan === "pro" ? 300 : 2000)
  const remainingCredits = Math.max(0, totalCredits - usedCredits)
  const usagePercent = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0

  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Account Usage</h1>
          <p className="text-muted-foreground">Monitor your usage and manage your credits</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Total Credits */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  usagePercent > 90 ? "bg-red-500/10 text-red-500" :
                  usagePercent > 70 ? "bg-yellow-500/10 text-yellow-500" :
                  "bg-green-500/10 text-green-500"
                )}>
                  {usagePercent.toFixed(0)}% used
                </span>
              </div>
              <p className="text-2xl font-bold">{remainingCredits.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Credits remaining</p>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    usagePercent > 90 ? "bg-red-500" :
                    usagePercent > 70 ? "bg-yellow-500" :
                    "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, usagePercent)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {usedCredits} of {totalCredits} used this month
              </p>
            </CardContent>
          </Card>

          {/* Monthly Charges */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">£{totalCost.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Charges this month</p>
              <p className="text-xs text-muted-foreground mt-3">
                Average: £{(totalCost / 30).toFixed(2)}/day
              </p>
            </CardContent>
          </Card>

          {/* Reset Date */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">
                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
              <p className="text-sm text-muted-foreground">Credits reset date</p>
              <p className="text-xs text-muted-foreground mt-3">
                {Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Alert */}
        {usagePercent > 80 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-yellow-500">Approaching usage limit</p>
                  <p className="text-sm text-muted-foreground">
                    You have used {usagePercent.toFixed(0)}% of your monthly credits. Consider purchasing more credits or upgrading your plan.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10">
                  Set Alert
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Add Credits Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Credits
              </CardTitle>
              <CardDescription>Purchase additional credits for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {creditPacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handlePurchaseCredits(pack.id)}
                    disabled={isPurchasing}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all hover:border-primary/50 hover:bg-primary/5",
                      pack.discount > 0 ? "border-primary/30" : "border-border"
                    )}
                  >
                    {pack.discount > 0 && (
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {pack.discount}% OFF
                      </span>
                    )}
                    <p className="text-xl font-bold mt-2">{pack.credits}</p>
                    <p className="text-xs text-muted-foreground">credits</p>
                    <p className="text-lg font-semibold text-primary mt-2">£{pack.price}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resource Usage Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resource Usage</CardTitle>
                  <CardDescription>Detailed breakdown of your usage</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">This Month</SelectItem>
                      <SelectItem value="last">Last Month</SelectItem>
                      <SelectItem value="2months">2 Months Ago</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead className="text-right">Usage</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* AI Section */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-sm">
                      AI Services
                    </TableCell>
                  </TableRow>
                  {resourceUsage.filter(r => r.category === "AI").map((resource, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <resource.icon className="w-4 h-4 text-muted-foreground" />
                          {resource.item}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {resource.usage.toLocaleString()} {resource.unit}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        £{resource.unitPrice.toFixed(3)}/{resource.unit.slice(0, -1)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        £{resource.cost.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* App Section */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-sm">
                      App Services
                    </TableCell>
                  </TableRow>
                  {resourceUsage.filter(r => r.category === "App").map((resource, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <resource.icon className="w-4 h-4 text-muted-foreground" />
                          {resource.item}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {resource.usage.toLocaleString()} {resource.unit}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        £{resource.unitPrice.toFixed(3)}/{resource.unit}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        £{resource.cost.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Total */}
                  <TableRow className="border-t-2">
                    <TableCell colSpan={3} className="font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      £{totalCost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SettingsLayout>
  )
}
