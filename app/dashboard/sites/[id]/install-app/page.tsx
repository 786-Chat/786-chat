"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  Tablet, 
  Share, 
  Plus, 
  MoreVertical, 
  Download,
  CheckCircle2,
  Monitor,
  ChefHat,
  Car,
  Loader2
} from "lucide-react"

interface SiteSettings {
  site_name?: string
  pwa_app_name?: string
  pwa_icon_url?: string
  pwa_theme_color?: string
}

export default function InstallAppPage() {
  const params = useParams()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(isInStandaloneMode)

    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/customer/sites/${params.id}/pwa-settings`)
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [params.id])

  const appName = settings?.pwa_app_name || settings?.site_name || "Your App"

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
        <h1 className="text-2xl font-bold">Install App</h1>
        <p className="text-muted-foreground">
          Add your website to phones and tablets for quick access
        </p>
      </div>

      {isStandalone && (
        <Card className="border-green-500 bg-green-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-700">App Already Installed</p>
                <p className="text-sm text-green-600">You are viewing this page in the installed app</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Website Install */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Customer Website</CardTitle>
              <CardDescription>Let customers install your website as an app</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your website URL with customers. They can add it to their home screen for instant access to your menu and ordering.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* iPhone Instructions */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">iPhone / iPad</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Open website in <strong>Safari</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Tap <Share className="inline w-4 h-4 mx-1" /> Share button</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Tap <Plus className="inline w-4 h-4 mx-1" /> <strong>Add to Home Screen</strong></span>
                </div>
              </div>
            </div>

            {/* Android Instructions */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Android</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Open website in <strong>Chrome</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Tap <MoreVertical className="inline w-4 h-4 mx-1" /> menu (3 dots)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Tap <strong>Install App</strong> or <strong>Add to Home Screen</strong></span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <CardTitle>Manager Dashboard</CardTitle>
              <CardDescription>Install the dashboard for quick order management</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Install the manager dashboard on your phone or tablet to manage orders, view reports, and update your menu on the go.
          </p>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Install Manager Dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Kitchen Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <CardTitle>Kitchen Display App</CardTitle>
              <CardDescription>Install on kitchen tablet for order display</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set up a tablet in your kitchen with the Kitchen Display App. Staff will see incoming orders in real-time and can mark them as ready.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <Tablet className="w-4 h-4" />
              Install Kitchen Display
            </Button>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">Kitchen Display URL</h4>
            <code className="text-xs bg-background px-2 py-1 rounded">
              {typeof window !== "undefined" ? window.location.origin : ""}/dashboard/sites/{params.id}/kitchen
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Driver App */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Car className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <CardTitle>Driver App</CardTitle>
              <CardDescription>Install for delivery drivers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drivers can install the Driver App on their phone to receive delivery assignments, view customer addresses, and update delivery status.
          </p>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Install Driver App
          </Button>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">Driver App URL</h4>
            <code className="text-xs bg-background px-2 py-1 rounded">
              {typeof window !== "undefined" ? window.location.origin : ""}/driver/{params.id}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Branding Info */}
      <Card>
        <CardHeader>
          <CardTitle>App Branding</CardTitle>
          <CardDescription>How your app appears when installed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {settings?.pwa_icon_url ? (
              <img 
                src={settings.pwa_icon_url} 
                alt="App Icon" 
                className="w-16 h-16 rounded-xl border"
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: settings?.pwa_theme_color || "#000" }}
              >
                {appName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{appName}</p>
              <p className="text-sm text-muted-foreground">
                Customize in <a href={`/dashboard/sites/${params.id}/pwa-settings`} className="text-primary hover:underline">PWA Settings</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
