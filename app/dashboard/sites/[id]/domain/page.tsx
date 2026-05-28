"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { 
  Globe, 
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useSWR from "swr"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

export default function DomainSettingsPage() {
  const params = useParams()
  const siteId = params.id as string

  const { data: siteData } = useSWR(
    siteId ? `/api/customer/sites/${siteId}` : null,
    fetcher
  )

  const site = siteData?.site
  const subdomain = site?.subdomain || ""
  const siteUrl = `${subdomain}.mujeebproai.com`

  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Domain Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your website domain and URL
        </p>
      </div>

      {/* Current Domain */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Your Website URL
          </CardTitle>
          <CardDescription>This is where your website is accessible</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">{siteUrl}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your MujeebProAI subdomain
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(`https://${siteUrl}`)}
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <a
              href={`/site/${subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            Custom Domain
          </CardTitle>
          <CardDescription>Connect your own domain name (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-border bg-muted/30">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Custom domains coming soon</p>
                <p className="text-sm text-muted-foreground">
                  Connect your own domain like yourbusiness.com
                </p>
              </div>
            </div>

            <div className="space-y-2 opacity-50 pointer-events-none">
              <Label htmlFor="custom_domain">Custom Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="custom_domain"
                  placeholder="yourbusiness.com"
                  disabled
                />
                <Button disabled>Connect</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your domain without http:// or www
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DNS Settings Info */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>DNS Configuration</CardTitle>
          <CardDescription>Required DNS settings for custom domains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Value</th>
                </tr>
              </thead>
              <tbody className="opacity-50">
                <tr className="border-b">
                  <td className="p-3 font-mono text-sm">A</td>
                  <td className="p-3 font-mono text-sm">@</td>
                  <td className="p-3 font-mono text-sm">76.76.21.21</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-sm">CNAME</td>
                  <td className="p-3 font-mono text-sm">www</td>
                  <td className="p-3 font-mono text-sm">cname.vercel-dns.com</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            These DNS records will be required when custom domains are available
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
