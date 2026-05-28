"use client"

import { useState, useEffect } from "react"
import { useShop } from "../layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2, CheckCircle, AlertTriangle, FileText, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Invoice {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "overdue"
}

export default function BillingPage() {
  const { site } = useShop()
  const [isLoading, setIsLoading] = useState(true)
  const [plan, setPlan] = useState({
    name: "Professional",
    price: 49.99,
    billing_cycle: "monthly",
    next_billing: "2024-02-01",
    status: "active"
  })
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    if (site?.id) {
      setIsLoading(false)
    }
  }, [site?.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-500">Manage your subscription and view invoices</p>
      </div>

      {site?.is_locked && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Payment Overdue</h3>
                <p className="text-sm text-red-700 mt-1">
                  Your subscription payment is overdue. Your website is currently suspended.
                  Please make a payment to reactivate your services.
                </p>
                <Button className="mt-3 bg-red-600 hover:bg-red-700">
                  Pay Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
              <div>
                <p className="font-semibold text-lg">{plan.name}</p>
                <p className="text-sm text-slate-500">Billed {plan.billing_cycle}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">£{plan.price}</p>
                <p className="text-sm text-slate-500">per month</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <Badge variant={plan.status === "active" ? "default" : "destructive"}>
                {plan.status === "active" ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                ) : (
                  "Suspended"
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Next Billing Date</span>
              <span className="font-medium">{plan.next_billing}</span>
            </div>
            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your saved payment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
              <CreditCard className="w-8 h-8 text-slate-400" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-slate-500">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Your past invoices and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium">{invoice.date}</p>
                      <p className="text-sm text-slate-500">£{invoice.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>
                      {invoice.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
