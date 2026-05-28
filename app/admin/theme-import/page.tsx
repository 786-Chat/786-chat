"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Upload,
  Link as LinkIcon,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  Globe,
  Code,
  FileCode,
  Palette,
  DollarSign,
  Star,
  StarOff,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface ImportedTheme {
  id: string
  name: string
  slug: string
  description: string
  category: string
  price: number
  source_type: string
  source_url: string
  preview_image_url: string
  preview_url: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
  }
  features: string[]
  is_active: boolean
  is_featured: boolean
  is_ready_for_sale: boolean
  version: string
  sales_count: number
  created_at: string
  updated_at: string
}

const SOURCE_TYPES = [
  { value: "replit", label: "Replit", icon: Code },
  { value: "godaddy", label: "GoDaddy", icon: Globe },
  { value: "wordpress", label: "WordPress", icon: FileCode },
  { value: "wix", label: "Wix", icon: Globe },
  { value: "squarespace", label: "Squarespace", icon: Globe },
  { value: "custom", label: "Custom Upload", icon: Upload },
]

const CATEGORIES = [
  "restaurant",
  "cafe",
  "pizza",
  "chicken",
  "bakery",
  "bar",
  "food-truck",
  "catering",
]

const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Roboto",
  "Playfair Display",
  "Montserrat",
  "Lato",
  "Open Sans",
  "Raleway",
]

export default function AdminThemeImportPage() {
  const [themes, setThemes] = useState<ImportedTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSource, setFilterSource] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ImportedTheme | null>(null)
  const [importMethod, setImportMethod] = useState<"url" | "upload">("url")
  const [saving, setSaving] = useState(false)

  // Import form state
  const [importForm, setImportForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "restaurant",
    price: 49.99,
    source_type: "replit",
    source_url: "",
    preview_image_url: "",
    colors: { primary: "#1a1a2e", secondary: "#d4af37", accent: "#f5f5dc" },
    fonts: { heading: "Inter", body: "Inter" },
    features: ["Responsive Design", "SEO Optimized", "Mobile First"],
  })

  const fetchThemes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/imported-themes")
      if (res.ok) {
        const data = await res.json()
        setThemes(data)
      }
    } catch (error) {
      console.error("Failed to fetch themes:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThemes()
  }, [fetchThemes])

  const handleImport = async () => {
    if (!importForm.name || !importForm.slug) {
      toast.error("Name and slug are required")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/imported-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importForm),
      })

      if (res.ok) {
        toast.success("Theme imported successfully")
        setShowImportDialog(false)
        resetImportForm()
        fetchThemes()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to import theme")
      }
    } catch (error) {
      toast.error("Failed to import theme")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedTheme) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/imported-themes/${selectedTheme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedTheme),
      })

      if (res.ok) {
        toast.success("Theme updated successfully")
        setShowEditDialog(false)
        setSelectedTheme(null)
        fetchThemes()
      } else {
        toast.error("Failed to update theme")
      }
    } catch (error) {
      toast.error("Failed to update theme")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this theme?")) return

    try {
      const res = await fetch(`/api/admin/imported-themes/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Theme deleted")
        fetchThemes()
      } else {
        toast.error("Failed to delete theme")
      }
    } catch (error) {
      toast.error("Failed to delete theme")
    }
  }

  const toggleActive = async (theme: ImportedTheme) => {
    try {
      const res = await fetch(`/api/admin/imported-themes/${theme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...theme, is_active: !theme.is_active }),
      })

      if (res.ok) {
        toast.success(theme.is_active ? "Theme deactivated" : "Theme activated")
        fetchThemes()
      }
    } catch (error) {
      toast.error("Failed to update theme")
    }
  }

  const toggleFeatured = async (theme: ImportedTheme) => {
    try {
      const res = await fetch(`/api/admin/imported-themes/${theme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...theme, is_featured: !theme.is_featured }),
      })

      if (res.ok) {
        toast.success(theme.is_featured ? "Removed from featured" : "Added to featured")
        fetchThemes()
      }
    } catch (error) {
      toast.error("Failed to update theme")
    }
  }

  const toggleReadyForSale = async (theme: ImportedTheme) => {
    try {
      const res = await fetch(`/api/admin/imported-themes/${theme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...theme, is_ready_for_sale: !theme.is_ready_for_sale }),
      })

      if (res.ok) {
        toast.success(theme.is_ready_for_sale ? "Removed from sale" : "Ready for sale")
        fetchThemes()
      }
    } catch (error) {
      toast.error("Failed to update theme")
    }
  }

  const resetImportForm = () => {
    setImportForm({
      name: "",
      slug: "",
      description: "",
      category: "restaurant",
      price: 49.99,
      source_type: "replit",
      source_url: "",
      preview_image_url: "",
      colors: { primary: "#1a1a2e", secondary: "#d4af37", accent: "#f5f5dc" },
      fonts: { heading: "Inter", body: "Inter" },
      features: ["Responsive Design", "SEO Optimized", "Mobile First"],
    })
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const filteredThemes = themes.filter((theme) => {
    const matchesSearch =
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSource = filterSource === "all" || theme.source_type === filterSource
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && theme.is_active) ||
      (filterStatus === "inactive" && !theme.is_active) ||
      (filterStatus === "featured" && theme.is_featured) ||
      (filterStatus === "ready" && theme.is_ready_for_sale)
    return matchesSearch && matchesSource && matchesStatus
  })

  const stats = {
    total: themes.length,
    active: themes.filter((t) => t.is_active).length,
    featured: themes.filter((t) => t.is_featured).length,
    readyForSale: themes.filter((t) => t.is_ready_for_sale).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Theme Import Library</h1>
          <p className="text-muted-foreground">
            Import and manage themes from external sources
          </p>
        </div>
        <Button onClick={() => setShowImportDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Import Theme
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Themes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{stats.featured}</div>
            <p className="text-xs text-muted-foreground">Featured</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.readyForSale}</div>
            <p className="text-xs text-muted-foreground">Ready for Sale</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCE_TYPES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="ready">Ready for Sale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Themes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredThemes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No themes found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Import your first theme to get started
            </p>
            <Button onClick={() => setShowImportDialog(true)}>Import Theme</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThemes.map((theme) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden group">
                {/* Preview Image */}
                <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50">
                  {theme.preview_image_url ? (
                    <img
                      src={theme.preview_image_url}
                      alt={theme.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Palette className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {theme.is_featured && (
                      <Badge className="bg-amber-500">Featured</Badge>
                    )}
                    {theme.is_ready_for_sale && (
                      <Badge className="bg-green-500">For Sale</Badge>
                    )}
                  </div>
                  
                  {/* Source Badge */}
                  <Badge variant="secondary" className="absolute top-2 right-2">
                    {SOURCE_TYPES.find((s) => s.value === theme.source_type)?.label || theme.source_type}
                  </Badge>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {theme.preview_url && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(theme.preview_url, "_blank")}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedTheme(theme)
                        setShowEditDialog(true)
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
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
                        <DropdownMenuItem onClick={() => toggleActive(theme)}>
                          {theme.is_active ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleFeatured(theme)}>
                          {theme.is_featured ? (
                            <>
                              <StarOff className="w-4 h-4 mr-2" />
                              Remove Featured
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4 mr-2" />
                              Make Featured
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleReadyForSale(theme)}>
                          {theme.is_ready_for_sale ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Remove from Sale
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Mark Ready for Sale
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTheme(theme)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        {theme.source_url && (
                          <DropdownMenuItem
                            onClick={() => window.open(theme.source_url, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Source
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(theme.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {theme.description || "No description"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{theme.category}</Badge>
                      <span className="text-sm font-semibold">${theme.price}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                  </div>

                  {theme.sales_count > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {theme.sales_count} sales
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Theme</DialogTitle>
          </DialogHeader>

          <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as "url" | "upload")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">Import from URL</TabsTrigger>
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Type</Label>
                  <Select
                    value={importForm.source_type}
                    onValueChange={(v) => setImportForm({ ...importForm, source_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPES.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source URL</Label>
                  <Input
                    placeholder="https://replit.com/@user/project"
                    value={importForm.source_url}
                    onChange={(e) => setImportForm({ ...importForm, source_url: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop theme files here, or click to browse
                </p>
                <Button variant="outline" size="sm">
                  Choose Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports ZIP, HTML, CSS, JS files
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme Name *</Label>
                <Input
                  placeholder="Gourmet Elegance"
                  value={importForm.name}
                  onChange={(e) => {
                    setImportForm({
                      ...importForm,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  placeholder="gourmet-elegance"
                  value={importForm.slug}
                  onChange={(e) => setImportForm({ ...importForm, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="A sophisticated theme for fine dining..."
                value={importForm.description}
                onChange={(e) => setImportForm({ ...importForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={importForm.category}
                  onValueChange={(v) => setImportForm({ ...importForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={importForm.price}
                  onChange={(e) => setImportForm({ ...importForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preview Image URL</Label>
              <Input
                placeholder="https://example.com/preview.jpg"
                value={importForm.preview_image_url}
                onChange={(e) => setImportForm({ ...importForm, preview_image_url: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={importForm.colors.primary}
                    onChange={(e) =>
                      setImportForm({
                        ...importForm,
                        colors: { ...importForm.colors, primary: e.target.value },
                      })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={importForm.colors.primary}
                    onChange={(e) =>
                      setImportForm({
                        ...importForm,
                        colors: { ...importForm.colors, primary: e.target.value },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={importForm.colors.secondary}
                    onChange={(e) =>
                      setImportForm({
                        ...importForm,
                        colors: { ...importForm.colors, secondary: e.target.value },
                      })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={importForm.colors.secondary}
                    onChange={(e) =>
                      setImportForm({
                        ...importForm,
                        colors: { ...importForm.colors, secondary: e.target.value },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={importForm.colors.accent}
                    onChange={(e) =>
                      setImportForm({
                        ...importForm,
                        colors: { ...importForm.colors, accent: e.target.value },
                      })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={importForm.colors.accent}
                    onChange={(e) =>
                      setImportForm({
                        ...importForm,
                        colors: { ...importForm.colors, accent: e.target.value },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heading Font</Label>
                <Select
                  value={importForm.fonts.heading}
                  onValueChange={(v) =>
                    setImportForm({ ...importForm, fonts: { ...importForm.fonts, heading: v } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Body Font</Label>
                <Select
                  value={importForm.fonts.body}
                  onValueChange={(v) =>
                    setImportForm({ ...importForm, fonts: { ...importForm.fonts, body: v } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Theme</DialogTitle>
          </DialogHeader>

          {selectedTheme && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Theme Name</Label>
                  <Input
                    value={selectedTheme.name}
                    onChange={(e) =>
                      setSelectedTheme({ ...selectedTheme, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={selectedTheme.slug}
                    onChange={(e) =>
                      setSelectedTheme({ ...selectedTheme, slug: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedTheme.description || ""}
                  onChange={(e) =>
                    setSelectedTheme({ ...selectedTheme, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={selectedTheme.category}
                    onValueChange={(v) =>
                      setSelectedTheme({ ...selectedTheme, category: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedTheme.price}
                    onChange={(e) =>
                      setSelectedTheme({
                        ...selectedTheme,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preview Image URL</Label>
                  <Input
                    value={selectedTheme.preview_image_url || ""}
                    onChange={(e) =>
                      setSelectedTheme({ ...selectedTheme, preview_image_url: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preview URL</Label>
                  <Input
                    value={selectedTheme.preview_url || ""}
                    onChange={(e) =>
                      setSelectedTheme({ ...selectedTheme, preview_url: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedTheme.colors.primary}
                      onChange={(e) =>
                        setSelectedTheme({
                          ...selectedTheme,
                          colors: { ...selectedTheme.colors, primary: e.target.value },
                        })
                      }
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={selectedTheme.colors.primary}
                      onChange={(e) =>
                        setSelectedTheme({
                          ...selectedTheme,
                          colors: { ...selectedTheme.colors, primary: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedTheme.colors.secondary}
                      onChange={(e) =>
                        setSelectedTheme({
                          ...selectedTheme,
                          colors: { ...selectedTheme.colors, secondary: e.target.value },
                        })
                      }
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={selectedTheme.colors.secondary}
                      onChange={(e) =>
                        setSelectedTheme({
                          ...selectedTheme,
                          colors: { ...selectedTheme.colors, secondary: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedTheme.colors.accent}
                      onChange={(e) =>
                        setSelectedTheme({
                          ...selectedTheme,
                          colors: { ...selectedTheme.colors, accent: e.target.value },
                        })
                      }
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={selectedTheme.colors.accent}
                      onChange={(e) =>
                        setSelectedTheme({
                          ...selectedTheme,
                          colors: { ...selectedTheme.colors, accent: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedTheme.is_active}
                    onCheckedChange={(checked) =>
                      setSelectedTheme({ ...selectedTheme, is_active: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedTheme.is_featured}
                    onCheckedChange={(checked) =>
                      setSelectedTheme({ ...selectedTheme, is_featured: checked })
                    }
                  />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedTheme.is_ready_for_sale}
                    onCheckedChange={(checked) =>
                      setSelectedTheme({ ...selectedTheme, is_ready_for_sale: checked })
                    }
                  />
                  <Label>Ready for Sale</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
