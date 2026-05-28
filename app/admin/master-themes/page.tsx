"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Palette,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Copy,
  Upload,
  X,
  Check,
  Loader2,
  MoreVertical,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface Theme {
  id: string
  name: string
  slug: string
  description: string
  long_description: string
  category_id: string
  category_name?: string
  price_cents: number
  currency: string
  thumbnail_url: string
  preview_url: string
  demo_url: string
  is_active: boolean
  is_featured: boolean
  features: string[]
  tags: string[]
  sales_count: number
  rating_avg: number
  rating_count: number
  created_at: string
}

interface Category {
  id: string
  name: string
  slug: string
}

const AVAILABLE_MODULES = [
  { id: "online_ordering", name: "Online Ordering", description: "Accept orders online" },
  { id: "table_booking", name: "Table Booking", description: "Reservation system" },
  { id: "delivery_tracking", name: "Delivery Tracking", description: "Real-time delivery updates" },
  { id: "reviews", name: "Customer Reviews", description: "Collect and display reviews" },
  { id: "loyalty", name: "Loyalty Program", description: "Rewards and points system" },
  { id: "gallery", name: "Photo Gallery", description: "Showcase images" },
  { id: "menu_builder", name: "Menu Builder", description: "Create and manage menus" },
  { id: "analytics", name: "Analytics", description: "Track site performance" },
]

export default function MasterThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    long_description: "",
    category_id: "",
    price_cents: 4999,
    currency: "GBP",
    thumbnail_url: "",
    preview_url: "",
    demo_url: "",
    is_active: true,
    is_featured: false,
    features: [] as string[],
    tags: [] as string[],
    modules: [] as string[],
  })
  
  // Duplicate form
  const [duplicateData, setDuplicateData] = useState({
    customer_email: "",
    site_name: "",
    subdomain: "",
  })

  useEffect(() => {
    fetchThemes()
    fetchCategories()
  }, [])

  const fetchThemes = async () => {
    try {
      const res = await fetch("/api/admin/master-themes")
      if (res.ok) {
        const data = await res.json()
        setThemes(data.themes || [])
      }
    } catch (error) {
      console.error("Failed to fetch themes:", error)
      toast.error("Failed to load themes")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/themes/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch {
      // Use default categories
      setCategories([
        { id: "1", name: "Restaurant", slug: "restaurant" },
        { id: "2", name: "Cafe", slug: "cafe" },
        { id: "3", name: "Pizza Shop", slug: "pizza" },
        { id: "4", name: "Chicken Shop", slug: "chicken" },
        { id: "5", name: "Bakery", slug: "bakery" },
      ])
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required")
      return
    }
    
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/master-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        toast.success("Theme created successfully")
        setShowCreateModal(false)
        resetForm()
        fetchThemes()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to create theme")
      }
    } catch {
      toast.error("Failed to create theme")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedTheme) return
    
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/master-themes/${selectedTheme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        toast.success("Theme updated successfully")
        setShowEditModal(false)
        setSelectedTheme(null)
        resetForm()
        fetchThemes()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to update theme")
      }
    } catch {
      toast.error("Failed to update theme")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (theme: Theme) => {
    if (!confirm(`Are you sure you want to delete "${theme.name}"?`)) return
    
    try {
      const res = await fetch(`/api/admin/master-themes/${theme.id}`, {
        method: "DELETE",
      })
      
      if (res.ok) {
        toast.success("Theme deleted successfully")
        fetchThemes()
      } else {
        toast.error("Failed to delete theme")
      }
    } catch {
      toast.error("Failed to delete theme")
    }
  }

  const handleToggleActive = async (theme: Theme) => {
    try {
      const res = await fetch(`/api/admin/master-themes/${theme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !theme.is_active }),
      })
      
      if (res.ok) {
        toast.success(theme.is_active ? "Theme disabled" : "Theme enabled")
        fetchThemes()
      }
    } catch {
      toast.error("Failed to update theme")
    }
  }

  const handleToggleFeatured = async (theme: Theme) => {
    try {
      const res = await fetch(`/api/admin/master-themes/${theme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_featured: !theme.is_featured }),
      })
      
      if (res.ok) {
        toast.success(theme.is_featured ? "Removed from featured" : "Marked as featured")
        fetchThemes()
      }
    } catch {
      toast.error("Failed to update theme")
    }
  }

  const handleDuplicate = async () => {
    if (!selectedTheme || !duplicateData.customer_email || !duplicateData.site_name || !duplicateData.subdomain) {
      toast.error("All fields are required")
      return
    }
    
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/master-themes/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme_id: selectedTheme.id,
          ...duplicateData,
        }),
      })
      
      if (res.ok) {
        toast.success("Theme duplicated to customer site")
        setShowDuplicateModal(false)
        setSelectedTheme(null)
        setDuplicateData({ customer_email: "", site_name: "", subdomain: "" })
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to duplicate theme")
      }
    } catch {
      toast.error("Failed to duplicate theme")
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      long_description: "",
      category_id: "",
      price_cents: 4999,
      currency: "GBP",
      thumbnail_url: "",
      preview_url: "",
      demo_url: "",
      is_active: true,
      is_featured: false,
      features: [],
      tags: [],
      modules: [],
    })
  }

  const openEditModal = (theme: Theme) => {
    setSelectedTheme(theme)
    setFormData({
      name: theme.name,
      slug: theme.slug,
      description: theme.description || "",
      long_description: theme.long_description || "",
      category_id: theme.category_id || "",
      price_cents: theme.price_cents,
      currency: theme.currency || "GBP",
      thumbnail_url: theme.thumbnail_url || "",
      preview_url: theme.preview_url || "",
      demo_url: theme.demo_url || "",
      is_active: theme.is_active,
      is_featured: theme.is_featured,
      features: theme.features || [],
      tags: theme.tags || [],
      modules: [],
    })
    setShowEditModal(true)
  }

  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         theme.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || theme.category_id === categoryFilter
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: themes.length,
    active: themes.filter(t => t.is_active).length,
    featured: themes.filter(t => t.is_featured).length,
    totalSales: themes.reduce((sum, t) => sum + (t.sales_count || 0), 0),
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Master Themes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage theme templates for customer sites
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Theme
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Themes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.featured}</p>
                <p className="text-xs text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
                <p className="text-xs text-muted-foreground">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Array.isArray(categories) && categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-3 gap-6">
        {filteredThemes.map((theme, index) => (
          <motion.div
            key={theme.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-card/50 border-border/50 overflow-hidden group">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted">
                {theme.thumbnail_url ? (
                  <img 
                    src={theme.thumbnail_url} 
                    alt={theme.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {theme.is_featured && (
                    <Badge className="bg-yellow-500 text-black">
                      <Star className="w-3 h-3 mr-1" /> Featured
                    </Badge>
                  )}
                  {!theme.is_active && (
                    <Badge variant="destructive">Disabled</Badge>
                  )}
                </div>
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEditModal(theme)}>
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      setSelectedTheme(theme)
                      setShowDuplicateModal(true)
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Duplicate
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{theme.name}</h3>
                    <p className="text-sm text-muted-foreground">{theme.slug}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(theme)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Theme
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedTheme(theme)
                        setShowDuplicateModal(true)
                      }}>
                        <Copy className="w-4 h-4 mr-2" /> Duplicate to Customer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleActive(theme)}>
                        {theme.is_active ? (
                          <><EyeOff className="w-4 h-4 mr-2" /> Disable</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" /> Enable</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleFeatured(theme)}>
                        <Star className="w-4 h-4 mr-2" />
                        {theme.is_featured ? "Remove Featured" : "Mark Featured"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(theme)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    £{(theme.price_cents / 100).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    {theme.sales_count || 0} sales
                  </span>
                </div>
                
                {theme.category_name && (
                  <Badge variant="outline" className="mt-2">
                    {theme.category_name}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredThemes.length === 0 && (
        <div className="text-center py-12">
          <Palette className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No themes found</p>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4 gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Theme
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedTheme(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditModal ? "Edit Theme" : "Create New Theme"}</DialogTitle>
            <DialogDescription>
              {showEditModal ? "Update theme details and settings" : "Create a new master theme template"}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Theme Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Gourmet Elegance"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="gourmet-elegance"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A sophisticated theme for fine dining..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Long Description</Label>
                <Textarea
                  value={formData.long_description}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                  placeholder="Detailed description of the theme..."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price (pence)</Label>
                  <Input
                    type="number"
                    value={formData.price_cents}
                    onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Featured</Label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Preview URL</Label>
                <Input
                  value={formData.preview_url}
                  onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Demo URL</Label>
                <Input
                  value={formData.demo_url}
                  onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Features (comma-separated)</Label>
                <Textarea
                  value={formData.features.join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    features: e.target.value.split(",").map(f => f.trim()).filter(Boolean)
                  })}
                  placeholder="Online Ordering, Table Booking, Menu Display..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={formData.tags.join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="restaurant, elegant, modern..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="modules" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Select which modules are available with this theme:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_MODULES.map(module => (
                  <div 
                    key={module.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.modules.includes(module.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => {
                      const modules = formData.modules.includes(module.id)
                        ? formData.modules.filter(m => m !== module.id)
                        : [...formData.modules, module.id]
                      setFormData({ ...formData, modules })
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        formData.modules.includes(module.id)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      }`}>
                        {formData.modules.includes(module.id) && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{module.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-7">
                      {module.description}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false)
              setShowEditModal(false)
              setSelectedTheme(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={showEditModal ? handleEdit : handleCreate} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {showEditModal ? "Save Changes" : "Create Theme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate to Customer Modal */}
      <Dialog open={showDuplicateModal} onOpenChange={(open) => {
        if (!open) {
          setShowDuplicateModal(false)
          setSelectedTheme(null)
          setDuplicateData({ customer_email: "", site_name: "", subdomain: "" })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Theme to Customer</DialogTitle>
            <DialogDescription>
              Create a new customer site based on "{selectedTheme?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer Email</Label>
              <Input
                type="email"
                value={duplicateData.customer_email}
                onChange={(e) => setDuplicateData({ ...duplicateData, customer_email: e.target.value })}
                placeholder="customer@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input
                value={duplicateData.site_name}
                onChange={(e) => setDuplicateData({ ...duplicateData, site_name: e.target.value })}
                placeholder="My Restaurant"
              />
            </div>
            <div className="space-y-2">
              <Label>Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={duplicateData.subdomain}
                  onChange={(e) => setDuplicateData({ 
                    ...duplicateData, 
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                  })}
                  placeholder="my-restaurant"
                />
                <span className="text-muted-foreground">.mujeebproai.com</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDuplicateModal(false)
              setSelectedTheme(null)
              setDuplicateData({ customer_email: "", site_name: "", subdomain: "" })
            }}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Customer Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
