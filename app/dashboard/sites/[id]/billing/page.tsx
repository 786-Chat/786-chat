"use client"

import { useParams } from "next/navigation"
import { 
  Receipt, 
  CreditCard,
  CheckCircle,
  Download,
  Calendar,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

export default function BillingPage() {
  const params = useParams()
  const siteId = params.id as string

  const { data: siteData } = useSWR(
    siteId ? `/api/customer/sites/${siteId}` : null,
    fetcher
  )

  const site = siteData?.site

  // Mock billing data
  const currentPlan = {
    name: site?.theme_name || "Standard Theme",
    price: "£49.99",
    billingCycle: "One-time payment",
    status: "active",
    purchaseDate: site?.created_at ? new Date(site.created_at).toLocaleDateString() : "-",
  }

  const invoices = [
    {
      id: "INV-001",
      date: site?.created_at ? new Date(site.created_at).toLocaleDateString() : "-",
      description: `${site?.theme_name || "Theme"} Purchase`,
      amount: "£49.99",
      status: "paid",
    },
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and view invoices
        </p>
      </div>

      {/* Current Plan */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{currentPlan.name}</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  currentPlan.status === "active" 
                    ? "bg-green-500/10 text-green-500"
                    : "bg-yellow-500/10 text-yellow-500"
                )}>
                  {currentPlan.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPlan.billingCycle}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
              <p className="text-2xl font-bold">{currentPlan.price}</p>
              <p className="text-xs text-muted-foreground">
                Purchased {currentPlan.purchaseDate}
              </p>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Payment Status</span>
              </div>
              <p className="font-medium text-green-500">Paid</p>
            </div>
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Purchase Date</span>
              </div>
              <p className="font-medium">{currentPlan.purchaseDate}</p>
            </div>
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Receipt className="w-4 h-4" />
                <span className="text-sm">Renewal</span>
              </div>
              <p className="font-medium">No renewal required</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Payment History
          </CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Invoice</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Description</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{invoice.id}</td>
                    <td className="p-3 text-sm text-muted-foreground">{invoice.date}</td>
                    <td className="p-3 text-sm hidden sm:table-cell">{invoice.description}</td>
                    <td className="p-3 font-medium">{invoice.amount}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        invoice.status === "paid" 
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      )}>
                        {invoice.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Need more features?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade to get custom domains, advanced SEO, and priority support
              </p>
            </div>
            <Button>
              View Upgrades
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
