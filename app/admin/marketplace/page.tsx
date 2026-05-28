"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Loader2, 
  Store, 
  CheckCircle, 
  XCircle, 
  Star, 
  Eye, 
  Search,
  Settings,
  Globe
} from "lucide-react"
import { toast } from "sonner"

interface MarketplaceRestaurant {
  id: string
  site_name: string
  subdomain: string
  user_email: string
  visibility_mode: string
  show_in_marketplace: boolean
  marketplace_approved: boolean
  marketplace_featured: boolean
  marketplace_category: string | null
  is_open: boolean
}

interface MarketplaceSettings {
  id: string
  is_enabled: boolean
  commission_percentage: number
  featured_fee: number
  default_radius_miles: number
}

export default function AdminMarketplacePage() {
  const [restaurants, setRestaurants] = useState<MarketplaceRestaurant[]>([])
  const [settings, setSettings] = useState<MarketplaceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [restaurantsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/marketplace/restaurants"),
        fetch("/api/admin/marketplace/settings")
      ])

      if (restaurantsRes.ok) {
        const data = await restaurantsRes.json()
        setRestaurants(data.restaurants || [])
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (siteId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/admin/marketplace/restaurants/${siteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplace_approved: approved })
      })

      if (res.ok) {
        setRestaurants(prev => 
          prev.map(r => r.id === siteId ? { ...r, marketplace_approved: approved } : r)
        )
        toast.success(approved ? "Restaurant approved!" : "Restaurant removed from marketplace")
      }
    } catch {
      toast.error("Failed to update")
    }
  }

  const handleFeature = async (siteId: string, featured: boolean) => {
    try {
      const res = await fetch(`/api/admin/marketplace/restaurants/${siteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplace_featured: featured })
      })

      if (res.ok) {
        setRestaurants(prev => 
          prev.map(r => r.id === siteId ? { ...r, marketplace_featured: featured } : r)
        )
        toast.success(featured ? "Restaurant featured!" : "Removed from featured")
      }
    } catch {
      toast.error("Failed to update")
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return
    setIsSaving(true)

    try {
      const res = await fetch("/api/admin/marketplace/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        toast.success("Settings saved!")
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredRestaurants = restaurants.filter(r =>
    r.site_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingCount = restaurants.filter(r => r.show_in_marketplace && !r.marketplace_approved).length
  const approvedCount = restaurants.filter(r => r.marketplace_approved).length
  const featuredCount = restaurants.filter(r => r.marketplace_featured).length

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
        <h1 className="text-2xl font-bold">Marketplace Management</h1>
        <p className="text-muted-foreground">
          Manage the public food marketplace and approve restaurants.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Store className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{restaurants.length}</p>
                <p className="text-sm text-muted-foreground">Total Restaurants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Eye className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{featuredCount}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Settings */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Marketplace Settings
            </CardTitle>
            <CardDescription>
              Configure global marketplace settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Marketplace Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Turn on/off the public marketplace
                </p>
              </div>
              <Switch
                checked={settings.is_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, is_enabled: checked })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Commission (%)</Label>
                <Input
                  type="number"
                  value={settings.commission_percentage}
                  onChange={(e) => setSettings({ ...settings, commission_percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Fee (£)</Label>
                <Input
                  type="number"
                  value={settings.featured_fee}
                  onChange={(e) => setSettings({ ...settings, featured_fee: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Default Radius (miles)</Label>
                <Input
                  type="number"
                  value={settings.default_radius_miles}
                  onChange={(e) => setSettings({ ...settings, default_radius_miles: parseFloat(e.target.value) || 5 })}
                  placeholder="5"
                />
              </div>
            </div>

            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Restaurants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Restaurants</CardTitle>
          <CardDescription>
            Approve, feature, or hide restaurants from the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Open</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{restaurant.site_name}</p>
                      <p className="text-sm text-muted-foreground">{restaurant.subdomain}.mujeebproai.com</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {restaurant.marketplace_category ? (
                      <Badge variant="secondary">{restaurant.marketplace_category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={restaurant.show_in_marketplace ? "default" : "outline"}>
                      {restaurant.visibility_mode === "both" ? "Website + Marketplace" :
                       restaurant.visibility_mode === "marketplace_only" ? "Marketplace Only" :
                       "Website Only"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {restaurant.marketplace_approved ? (
                        <Badge className="bg-green-500/10 text-green-600">Approved</Badge>
                      ) : restaurant.show_in_marketplace ? (
                        <Badge className="bg-amber-500/10 text-amber-600">Pending</Badge>
                      ) : (
                        <Badge variant="secondary">Not Requested</Badge>
                      )}
                      {restaurant.marketplace_featured && (
                        <Badge className="bg-yellow-500/10 text-yellow-600">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {restaurant.is_open ? (
                      <Badge variant="outline" className="text-green-600">Open</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">Closed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {restaurant.show_in_marketplace && (
                        <>
                          {restaurant.marketplace_approved ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(restaurant.id, false)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(restaurant.id, true)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          
                          <Button
                            variant={restaurant.marketplace_featured ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFeature(restaurant.id, !restaurant.marketplace_featured)}
                          >
                            <Star className={`w-4 h-4 ${restaurant.marketplace_featured ? "fill-current" : ""}`} />
                          </Button>
                        </>
                      )}

                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={`https://${restaurant.subdomain}.mujeebproai.com`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
