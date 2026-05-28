"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Globe, 
  Eye, 
  Users, 
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Settings,
  ExternalLink,
  ArrowUpRight,
  Calendar,
  Clock,
  AlertTriangle,
  CreditCard
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

export default function SiteOverviewPage() {
  const params = useParams()
  const siteId = params.id as string

  const { data: siteData } = useSWR(
    siteId ? `/api/customer/sites/${siteId}` : null,
    fetcher
  )

  const site = siteData?.site

  const quickActions = [
    { label: "Edit Content", href: `/dashboard/sites/${siteId}/content`, icon: FileText },
    { label: "Manage Gallery", href: `/dashboard/sites/${siteId}/gallery`, icon: ImageIcon },
    { label: "Theme Settings", href: `/dashboard/sites/${siteId}/theme`, icon: Settings },
    { label: "View Live Site", href: `/site/${site?.subdomain}`, icon: ExternalLink, external: true },
  ]

  const stats = [
    { label: "Page Views", value: "0", icon: Eye, change: "+0%" },
    { label: "Visitors", value: "0", icon: Users, change: "+0%" },
    { label: "Status", value: site?.is_published ? "Live" : "Draft", icon: Globe, change: "" },
    { label: "Last Updated", value: site?.updated_at ? new Date(site.updated_at).toLocaleDateString() : "-", icon: Calendar, change: "" },
  ]

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Payment Due Warning */}
      {(site.is_locked || site.payment_status === "overdue") && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-600">Payment Due</h3>
              <p className="text-sm text-red-500/80 mt-1">
                Your website is currently unavailable to the public due to an outstanding payment. 
                Please pay your subscription to reactivate your website.
              </p>
            </div>
            <Button variant="destructive" size="sm" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Pay Now
            </Button>
          </div>
        </motion.div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Website Overview</h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor your website performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  {stat.change && (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.change}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
              >
                <Button
                  variant="outline"
                  className="w-full h-auto py-6 flex flex-col gap-3 hover:bg-primary/5 hover:border-primary/30"
                >
                  <action.icon className="w-6 h-6 text-primary" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Site Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Site Name</span>
              <span className="font-medium">{site.site_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Subdomain</span>
              <span className="font-medium">{site.subdomain}.mujeebproai.com</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Theme</span>
              <span className="font-medium">{site.theme_name || "Custom"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                site.is_published 
                  ? "bg-green-500/10 text-green-500" 
                  : "bg-yellow-500/10 text-yellow-500"
              }`}>
                {site.is_published ? "Published" : "Draft"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {site.created_at ? new Date(site.created_at).toLocaleDateString() : "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No recent activity</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Activity will appear here as visitors interact with your site
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
