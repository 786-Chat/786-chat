"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  GripVertical,
  Star,
  Eye,
  EyeOff,
  Utensils
} from "lucide-react"
import { toast } from "sonner"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  is_available: boolean
  is_popular: boolean
  display_order: number
}

interface MenuCategory {
  id: string
  name: string
  description: string
  display_order: number
  is_active: boolean
  items: MenuItem[]
}

export default function ShopMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editItemDialog, setEditItemDialog] = useState(false)
  const [editCategoryDialog, setEditCategoryDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null)
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    is_available: true,
    is_popular: false,
    category_id: ""
  })
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    is_active: true
  })

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/shop/menu")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch menu:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP"
    }).format(amount / 100)
  }

  const openEditItem = (item: MenuItem | null, categoryId?: string) => {
    if (item) {
      setSelectedItem(item)
      setItemForm({
        name: item.name,
        description: item.description || "",
        price: (item.price / 100).toFixed(2),
        is_available: item.is_available,
        is_popular: item.is_popular,
        category_id: item.category_id
      })
    } else {
      setSelectedItem(null)
      setItemForm({
        name: "",
        description: "",
        price: "",
        is_available: true,
        is_popular: false,
        category_id: categoryId || ""
      })
    }
    setEditItemDialog(true)
  }

  const saveItem = async () => {
    try {
      const priceInCents = Math.round(parseFloat(itemForm.price) * 100)
      const method = selectedItem ? "PUT" : "POST"
      const url = selectedItem 
        ? `/api/shop/menu/items/${selectedItem.id}`
        : "/api/shop/menu/items"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...itemForm,
          price: priceInCents
        })
      })

      if (res.ok) {
        toast.success(selectedItem ? "Item updated" : "Item added")
        setEditItemDialog(false)
        fetchMenu()
      } else {
        toast.error("Failed to save item")
      }
    } catch (error) {
      toast.error("Failed to save item")
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    
    try {
      const res = await fetch(`/api/shop/menu/items/${itemId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast.success("Item deleted")
        fetchMenu()
      } else {
        toast.error("Failed to delete item")
      }
    } catch (error) {
      toast.error("Failed to delete item")
    }
  }

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/shop/menu/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !item.is_available })
      })

      if (res.ok) {
        toast.success(item.is_available ? "Item marked unavailable" : "Item marked available")
        fetchMenu()
      }
    } catch (error) {
      toast.error("Failed to update item")
    }
  }

  const openEditCategory = (category: MenuCategory | null) => {
    if (category) {
      setSelectedCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        is_active: category.is_active
      })
    } else {
      setSelectedCategory(null)
      setCategoryForm({
        name: "",
        description: "",
        is_active: true
      })
    }
    setEditCategoryDialog(true)
  }

  const saveCategory = async () => {
    try {
      const method = selectedCategory ? "PUT" : "POST"
      const url = selectedCategory 
        ? `/api/shop/menu/categories/${selectedCategory.id}`
        : "/api/shop/menu/categories"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm)
      })

      if (res.ok) {
        toast.success(selectedCategory ? "Category updated" : "Category added")
        setEditCategoryDialog(false)
        fetchMenu()
      } else {
        toast.error("Failed to save category")
      }
    } catch (error) {
      toast.error("Failed to save category")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu</h1>
          <p className="text-muted-foreground">Manage your menu items and categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openEditCategory(null)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Menu Categories */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No menu categories yet</p>
            <Button onClick={() => openEditCategory(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {categories.map((category) => (
            <AccordionItem 
              key={category.id} 
              value={category.id}
              className="border rounded-lg bg-card"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{category.name}</span>
                  <Badge variant="secondary">{category.items?.length || 0} items</Badge>
                  {!category.is_active && (
                    <Badge variant="outline" className="text-yellow-600">Hidden</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditCategory(category)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Category
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => openEditItem(null, category.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {category.items?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items in this category
                    </p>
                  ) : (
                    category.items?.map((item) => (
                      <motion.div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          !item.is_available ? "opacity-60 bg-muted/50" : "bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {item.is_popular && (
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                              )}
                              {!item.is_available && (
                                <Badge variant="outline" className="text-red-500">Unavailable</Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{formatCurrency(item.price)}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditItem(item)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleItemAvailability(item)}>
                                {item.is_available ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Mark Unavailable
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Mark Available
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={editItemDialog} onOpenChange={setEditItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Item description"
              />
            </div>
            <div>
              <Label>Price (GBP)</Label>
              <Input
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Available</Label>
              <Switch
                checked={itemForm.is_available}
                onCheckedChange={(checked) => setItemForm({ ...itemForm, is_available: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Popular Item</Label>
              <Switch
                checked={itemForm.is_popular}
                onCheckedChange={(checked) => setItemForm({ ...itemForm, is_popular: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItemDialog(false)}>Cancel</Button>
            <Button onClick={saveItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryDialog} onOpenChange={setEditCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Category description"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={categoryForm.is_active}
                onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategoryDialog(false)}>Cancel</Button>
            <Button onClick={saveCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
