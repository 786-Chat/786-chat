"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Globe, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  RefreshCw,
  DollarSign,
  Save
} from "lucide-react"
import { toast } from "sonner"

interface CountryPricing {
  id: string
  country_code: string
  country_name: string
  currency_code: string
  currency_symbol: string
  exchange_rate: number
  is_active: boolean
  flag_emoji?: string
}

// Base price in GBP
const BASE_THEME_PRICE_GBP = 49.99

export default function CurrencyPricingPage() {
  const [countries, setCountries] = useState<CountryPricing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCountry, setEditingCountry] = useState<CountryPricing | null>(null)
  
  const [formData, setFormData] = useState({
    country_code: "",
    country_name: "",
    currency_code: "",
    currency_symbol: "",
    exchange_rate: "1.00",
    is_active: true,
    flag_emoji: ""
  })

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      const res = await fetch("/api/admin/currency-pricing")
      if (res.ok) {
        const data = await res.json()
        setCountries(data.countries || [])
      }
    } catch (error) {
      console.error("Error fetching countries:", error)
      toast.error("Failed to load pricing data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.country_code || !formData.country_name || !formData.currency_code) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    try {
      const url = editingCountry 
        ? `/api/admin/currency-pricing/${editingCountry.id}`
        : "/api/admin/currency-pricing"
      
      const res = await fetch(url, {
        method: editingCountry ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          exchange_rate: parseFloat(formData.exchange_rate)
        })
      })

      if (res.ok) {
        toast.success(editingCountry ? "Country updated" : "Country added")
        fetchCountries()
        resetForm()
      } else {
        toast.error("Failed to save")
      }
    } catch {
      toast.error("Error saving")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this country pricing?")) return

    try {
      const res = await fetch(`/api/admin/currency-pricing/${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast.success("Country deleted")
        fetchCountries()
      }
    } catch {
      toast.error("Error deleting")
    }
  }

  const handleToggleActive = async (country: CountryPricing) => {
    try {
      const res = await fetch(`/api/admin/currency-pricing/${country.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !country.is_active })
      })
      if (res.ok) {
        fetchCountries()
      }
    } catch {
      toast.error("Error updating")
    }
  }

  const resetForm = () => {
    setFormData({
      country_code: "",
      country_name: "",
      currency_code: "",
      currency_symbol: "",
      exchange_rate: "1.00",
      is_active: true,
      flag_emoji: ""
    })
    setEditingCountry(null)
    setShowAddDialog(false)
  }

  const openEditDialog = (country: CountryPricing) => {
    setEditingCountry(country)
    setFormData({
      country_code: country.country_code,
      country_name: country.country_name,
      currency_code: country.currency_code,
      currency_symbol: country.currency_symbol,
      exchange_rate: String(country.exchange_rate),
      is_active: country.is_active,
      flag_emoji: country.flag_emoji || ""
    })
    setShowAddDialog(true)
  }

  const calculatePrice = (exchangeRate: number) => {
    return (BASE_THEME_PRICE_GBP * exchangeRate).toFixed(2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Currency & Pricing</h1>
          <p className="text-muted-foreground mt-1">
            Set theme prices for different countries and currencies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCountries}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Country
          </Button>
        </div>
      </div>

      {/* Base Price Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Base Price (GBP)
          </CardTitle>
          <CardDescription>
            All other currencies are calculated from this base price using exchange rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">£{BASE_THEME_PRICE_GBP}</div>
            <Badge variant="secondary">Per Theme</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Countries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Country Pricing
          </CardTitle>
          <CardDescription>
            {countries.length} countries configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Exchange Rate</TableHead>
                <TableHead>Theme Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countries.map((country) => (
                <TableRow key={country.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {country.flag_emoji && <span className="text-2xl">{country.flag_emoji}</span>}
                      {country.country_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{country.country_code}</Badge>
                  </TableCell>
                  <TableCell>{country.currency_code}</TableCell>
                  <TableCell>
                    <span className="text-lg font-bold text-primary">{country.currency_symbol}</span>
                  </TableCell>
                  <TableCell>{Number(country.exchange_rate).toFixed(4)}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {country.currency_symbol}{calculatePrice(Number(country.exchange_rate))}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={country.is_active}
                      onCheckedChange={() => handleToggleActive(country)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(country)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(country.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {countries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No countries configured. Add your first country.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCountry ? "Edit Country Pricing" : "Add Country Pricing"}
            </DialogTitle>
            <DialogDescription>
              Configure pricing for a specific country and currency
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country Code *</Label>
                <Input
                  placeholder="GB"
                  maxLength={2}
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country Name *</Label>
                <Input
                  placeholder="United Kingdom"
                  value={formData.country_name}
                  onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency Code *</Label>
                <Input
                  placeholder="GBP"
                  maxLength={3}
                  value={formData.currency_code}
                  onChange={(e) => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency Symbol *</Label>
                <Input
                  placeholder="£"
                  value={formData.currency_symbol}
                  onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Exchange Rate (from GBP)</Label>
              <Input
                type="number"
                step="0.0001"
                placeholder="1.00"
                value={formData.exchange_rate}
                onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Theme price: {formData.currency_symbol || "$"}{calculatePrice(parseFloat(formData.exchange_rate) || 1)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingCountry ? "Update" : "Add"} Country
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
