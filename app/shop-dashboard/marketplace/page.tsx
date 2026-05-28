"use client"

import { useState, useEffect } from "react"
import { useShop } from "../layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Store, Loader2, Save, Eye, EyeOff } from "lucide-react"

export default function MarketplacePage() {
  const { site } = useShop()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    show_in_marketplace: true,
    marketplace_description: "",
    featured_image: "",
    tags: [] as string[],
    cuisine_type: "",
  })

  useEffect(() => {
    if (site?.id) {
      setIsLoading(false)
    }
  }, [site?.id])

  const handleSave = async () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketplace Settings</h1>
          <p className="text-slate-500">Configure how your restaurant appears in the marketplace</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-orange-500 hover:bg-orange-600">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
            <CardDescription>Control marketplace presence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Show in Marketplace</Label>
                <p className="text-sm text-slate-500">Allow customers to find you in the marketplace</p>
              </div>
              <Switch checked={settings.show_in_marketplace} onCheckedChange={(v) => setSettings({...settings, show_in_marketplace: v})} />
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2 text-sm">
                {settings.show_in_marketplace ? (
                  <>
                    <Eye className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Visible in marketplace</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-500">Hidden from marketplace</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restaurant Details</CardTitle>
            <CardDescription>Information shown in marketplace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cuisine Type</Label>
              <Input placeholder="e.g., Italian, Indian, Chinese" value={settings.cuisine_type} onChange={(e) => setSettings({...settings, cuisine_type: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe your restaurant..." 
                value={settings.marketplace_description} 
                onChange={(e) => setSettings({...settings, marketplace_description: e.target.value})}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
