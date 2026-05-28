"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { 
  UtensilsCrossed, 
  Plus,
  Trash2,
  Edit2,
  Save,
  Loader2,
  Check,
  GripVertical,
  X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import useSWR from "swr"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

interface MenuItem {
  id: string
  name: string
  description: string
  price: string
  category: string
  image?: string
}

export default function MenuServicesPage() {
  const params = useParams()
  const siteId = params.id as string

  const { data: siteData, mutate } = useSWR(
    siteId ? `/api/customer/sites/${siteId}` : null,
    fetcher
  )

  const site = siteData?.site
  const siteContent = site?.site_content || {}
  const menuItems: MenuItem[] = siteContent.menu || []

  const [items, setItems] = useState<MenuItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    setItems(menuItems)
  }, [menuItems])

  const saveItems = useCallback(async (updatedItems: MenuItem[]) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          site_content: {
            ...siteContent,
            menu: updatedItems,
          },
        }),
      })
      if (res.ok) {
        setLastSaved(new Date())
        mutate()
      }
    } catch (err) {
      console.error("Failed to save menu:", err)
    } finally {
      setIsSaving(false)
    }
  }, [siteId, siteContent, mutate])

  const openAddModal = () => {
    setEditingItem(null)
    setFormData({ name: "", description: "", price: "", category: "" })
    setIsModalOpen(true)
  }

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    const newItem: MenuItem = {
      id: editingItem?.id || `item_${Date.now()}`,
      ...formData,
    }

    let updatedItems: MenuItem[]
    if (editingItem) {
      updatedItems = items.map((item) => (item.id === editingItem.id ? newItem : item))
    } else {
      updatedItems = [...items, newItem]
    }

    setItems(updatedItems)
    setIsModalOpen(false)
    await saveItems(updatedItems)
  }

  const deleteItem = async (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id)
    setItems(updatedItems)
    await saveItems(updatedItems)
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Uncategorized"
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu / Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products, services, or menu items
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Saved
            </span>
          )}
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <UtensilsCrossed className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">No items yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Add your menu items, products, or services
              </p>
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <Card key={category} className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>{categoryItems.length} item{categoryItems.length !== 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background/50 group"
                    >
                      <div className="text-muted-foreground cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium truncate">{item.name}</h4>
                          {item.price && (
                            <span className="text-primary font-bold">£{item.price}</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (£)</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="9.99"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Starters, Main Course"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingItem ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
