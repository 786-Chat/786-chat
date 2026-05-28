"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye,
  Loader2,
  Search,
  Star,
  Layout,
  ExternalLink,
  MoreHorizontal,
  Check,
  X,
  ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Theme {
  id: string
  name: string
  slug: string
  description: string
  long_description: string
  price_cents: number
  currency: string
  thumbnail_url: string
  preview_url: string
  demo_url: string
  screenshots: string[]
  features: string[]
  tags: string[]
  category_id: string
  category_name: string
  is_active: boolean
  is_featured: boolean
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

const emptyTheme: Partial<Theme> = {
  name: "",
  slug: "",
  description: "",
  long_description: "",
  price_cents: 0,
  currency: "GBP",
  thumbnail_url: "",
  preview_url: "",
  demo_url: "",
  screenshots: [],
  features: [],
  tags: [],
  category_id: "",
  is_active: true,
  is_featured: false,
}

export default function AdminThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [formData, setFormData] = useState<Partial<Theme>>(emptyTheme)
  const [isSaving, setIsSaving] = useState(false)
  const [featuresInput, setFeaturesInput] = useState("")
  const [screenshotsInput, setScreenshotsInput] = useState("")

  useEffect(() => {
    fetchThemes()
  }, [])

  const fetchThemes = async () => {
    try {
      const res = await fetch("/api/admin/themes", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setThemes(data.themes || [])
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching themes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedTheme(null)
    setFormData(emptyTheme)
    setFeaturesInput("")
    setScreenshotsInput("")
    setIsDialogOpen(true)
  }

  const handleEdit = (theme: Theme) => {
    setSelectedTheme(theme)
    setFormData({
      ...theme,
      features: theme.features || [],
      screenshots: theme.screenshots || [],
    })
    setFeaturesInput((theme.features || []).join("\n"))
    setScreenshotsInput((theme.screenshots || []).join("\n"))
    setIsDialogOpen(true)
  }

  const handleDelete = (theme: Theme) => {
    setSelectedTheme(theme)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedTheme) return
    
    try {
      const res = await fetch(`/api/admin/themes?id=${selectedTheme.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      
      if (res.ok) {
        setThemes(themes.filter(t => t.id !== selectedTheme.id))
      }
    } catch (error) {
      console.error("Error deleting theme:", error)
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedTheme(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    const features = featuresInput.split("\n").filter(f => f.trim())
    const screenshots = screenshotsInput.split("\n").filter(s => s.trim())
    
    const payload = {
      ...formData,
      features,
      screenshots,
      slug: formData.slug || formData.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }

    try {
      const method = selectedTheme ? "PUT" : "POST"
      const body = selectedTheme ? { ...payload, id: selectedTheme.id } : payload

      const res = await fetch("/api/admin/themes", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await fetchThemes()
        setIsDialogOpen(false)
        setFormData(emptyTheme)
        setSelectedTheme(null)
      } else {
        const data = await res.json()
        alert(data.error || "Failed to save theme")
      }
    } catch (error) {
      console.error("Error saving theme:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatPrice = (cents: number, currency: string) => {
    if (cents === 0) return "Free"
    const amount = cents / 100
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP"
    }).format(amount)
  }

  const filteredThemes = themes.filter(theme =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Theme Manager</h1>
          <p className="text-muted-foreground">Create and manage marketplace themes</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Theme
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{themes.length}</div>
            <p className="text-sm text-muted-foreground">Total Themes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{themes.filter(t => t.is_active).length}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{themes.filter(t => t.is_featured).length}</div>
            <p className="text-sm text-muted-foreground">Featured</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{themes.reduce((sum, t) => sum + (t.sales_count || 0), 0)}</div>
            <p className="text-sm text-muted-foreground">Total Sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search themes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Themes Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredThemes.length === 0 ? (
            <div className="text-center py-12">
              <Layout className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No themes found</p>
              <Button variant="outline" className="mt-4" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Theme
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Theme</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThemes.map((theme) => (
                  <TableRow key={theme.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {theme.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={theme.thumbnail_url}
                              alt={theme.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {theme.name}
                            {theme.is_featured && (
                              <Badge variant="secondary" className="text-xs">Featured</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {theme.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{theme.category_name || "Uncategorized"}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(theme.price_cents, theme.currency)}
                    </TableCell>
                    <TableCell>
                      {theme.is_active ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{theme.sales_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span>{Number(theme.rating_avg || 0).toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(theme)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {theme.demo_url && (
                            <DropdownMenuItem asChild>
                              <a href={theme.demo_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Demo
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleDelete(theme)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTheme ? "Edit Theme" : "Create New Theme"}</DialogTitle>
            <DialogDescription>
              {selectedTheme ? "Update the theme details below" : "Fill in the details to create a new theme"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="media">Media & URLs</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Theme Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Modern Business Pro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug || ""}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated from name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description *</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description for cards and listings"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Long Description</Label>
                <Textarea
                  value={formData.long_description || ""}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                  placeholder="Detailed description for the theme page"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price (pence)</Label>
                  <Input
                    type="number"
                    value={formData.price_cents || 0}
                    onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
                    placeholder="0 for free"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency || "GBP"}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured || false}
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
                  value={formData.thumbnail_url || ""}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Demo URL</Label>
                <Input
                  value={formData.demo_url || ""}
                  onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                  placeholder="https://demo.example.com/theme"
                />
              </div>

              <div className="space-y-2">
                <Label>Preview URL</Label>
                <Input
                  value={formData.preview_url || ""}
                  onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Screenshots (one URL per line)</Label>
                <Textarea
                  value={screenshotsInput}
                  onChange={(e) => setScreenshotsInput(e.target.value)}
                  placeholder="https://example.com/screenshot1.jpg&#10;https://example.com/screenshot2.jpg"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="Responsive design&#10;Dark mode support&#10;SEO optimized&#10;Fast loading"
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Enter each feature on a new line. These will be displayed as a checklist.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Theme"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Theme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedTheme?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
