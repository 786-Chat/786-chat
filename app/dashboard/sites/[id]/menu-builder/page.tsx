"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  GripVertical,
  ImageIcon,
  Flame,
  Leaf,
  Star,
  Clock,
  AlertTriangle,
  ChevronRight,
  FolderPlus,
  Package,
  Loader2,
  Check,
  X,
  Upload,
  FileText,
  Table,
  ClipboardPaste,
  FileImage,
  Eye,
  Save,
  Zap,
  UtensilsCrossed,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  display_order: number
  is_active: boolean
  item_count?: number
}

interface MenuItem {
  id: string
  category_id?: string
  name: string
  description?: string
  price: number
  compare_price?: number
  image_url?: string
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  is_popular: boolean
  spice_level: number
  calories?: number
  prep_time_minutes?: number
  dietary_labels: string[]
  allergens: string[]
  ingredients?: string
  display_order: number
  variants?: Variant[]
  addon_groups?: AddonGroup[]
}

interface Variant {
  id: string
  name: string
  price: number
  is_default: boolean
  display_order: number
}

interface MealDeal {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  is_available: boolean
  items: { item_id: string; quantity: number }[]
  option_groups: string[] // addon group ids for choices like drink
}

interface AddonGroup {
  id: string
  name: string
  description?: string
  selection_type: string
  min_selections: number
  max_selections?: number
  is_required: boolean
  addons: Addon[]
}

interface Addon {
  id: string
  name: string
  price: number
  is_available: boolean
}

const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian", icon: "🥬" },
  { value: "vegan", label: "Vegan", icon: "🌱" },
  { value: "gluten-free", label: "Gluten Free", icon: "🌾" },
  { value: "halal", label: "Halal", icon: "☪️" },
  { value: "kosher", label: "Kosher", icon: "✡️" },
  { value: "dairy-free", label: "Dairy Free", icon: "🥛" },
  { value: "nut-free", label: "Nut Free", icon: "🥜" },
  { value: "keto", label: "Keto", icon: "🥑" },
]

const ALLERGEN_OPTIONS = [
  "Milk", "Eggs", "Fish", "Shellfish", "Tree Nuts", "Peanuts", 
  "Wheat", "Soybeans", "Sesame", "Mustard", "Celery", "Sulphites"
]

export default function MenuBuilderPage() {
  const params = useParams()
  const siteId = params.id as string
  
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("items")
  
  // Dialogs
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [showAddonGroupDialog, setShowAddonGroupDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingAddonGroup, setEditingAddonGroup] = useState<AddonGroup | null>(null)
  
  // Import states
  const [importMode, setImportMode] = useState<"paste" | "table" | "file">("paste")
  const [pasteText, setPasteText] = useState("")
  const [tableText, setTableText] = useState("")
  const [parsedItems, setParsedItems] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", image_url: "" })
  const [itemForm, setItemForm] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category_id: "",
    is_available: true,
    is_featured: false,
    is_new: false,
    is_popular: false,
    spice_level: 0,
    dietary_labels: [],
    allergens: [],
    variants: [],
  })
  const [addonGroupForm, setAddonGroupForm] = useState({
    name: "",
    description: "",
    selection_type: "multiple",
    min_selections: 0,
    max_selections: 10,
    is_required: false,
    addons: [] as { name: string; price: number }[],
  })

  useEffect(() => {
    fetchData()
  }, [siteId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [catRes, itemRes, addonRes] = await Promise.all([
        fetch(`/api/customer/sites/${siteId}/menu/categories`),
        fetch(`/api/customer/sites/${siteId}/menu/items`),
        fetch(`/api/customer/sites/${siteId}/menu/addon-groups`),
      ])
      
      if (catRes.ok) {
        const data = await catRes.json()
        setCategories(data.categories || [])
      }
      if (itemRes.ok) {
        const data = await itemRes.json()
        setItems(data.items || [])
      }
      if (addonRes.ok) {
        const data = await addonRes.json()
        setAddonGroups(data.groups || [])
      }
    } catch (error) {
      console.error("Failed to fetch menu data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Advanced parse pasted menu text with categories, sizes, options, and meal deals
  const parsePastedMenu = () => {
    const lines = pasteText.split("\n")
    const parsed: any[] = []
    const warnings: string[] = []
    let currentCategory = ""
    let currentItem: any = null

    const pushCurrentItem = () => {
      if (currentItem) {
        // Validate item has a price
        if (!currentItem.sizes?.length && !currentItem.price) {
          warnings.push(`"${currentItem.name}" has no price set`)
        }
        parsed.push(currentItem)
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // Skip empty lines
      if (!trimmed) continue

      // 1. Parse Category heading: **Category Name** or ## Category Name
      const categoryMatch = trimmed.match(/^\*\*(.+?)\*\*$/) || trimmed.match(/^##\s*(.+)$/)
      if (categoryMatch) {
        pushCurrentItem()
        currentItem = null
        currentCategory = categoryMatch[1].trim()
        continue
      }

      // 2. Parse "Category:" prefix format
      if (trimmed.toLowerCase().startsWith("category:")) {
        pushCurrentItem()
        currentItem = null
        currentCategory = trimmed.replace(/^category:\s*/i, "").trim()
        continue
      }

      // 3. Parse Sizes line: "Sizes: 10 inch £6.99, 12 inch £8.99, 15 inch £10.99"
      const sizesMatch = trimmed.match(/^sizes?:\s*(.+)/i)
      if (sizesMatch && currentItem) {
        const sizesStr = sizesMatch[1]
        const sizePattern = /([^,£]+?)\s*£([\d.]+)/g
        let match
        currentItem.sizes = []
        while ((match = sizePattern.exec(sizesStr)) !== null) {
          currentItem.sizes.push({
            name: match[1].trim(),
            price: parseFloat(match[2])
          })
        }
        // Set base price to first size
        if (currentItem.sizes.length > 0 && !currentItem.price) {
          currentItem.price = currentItem.sizes[0].price
        }
        continue
      }

      // 4. Parse Required Choice: "Choose 2: Leg, Thigh, Breast" or "Choose 1 Drink: Pepsi, 7Up"
      const chooseMatch = trimmed.match(/^choose\s+(\d+)(?:\s+(.+?))?:\s*(.+)/i)
      if (chooseMatch && currentItem) {
        const count = parseInt(chooseMatch[1])
        const groupName = chooseMatch[2]?.trim() || "Choice"
        const optionsStr = chooseMatch[3]
        const options = optionsStr.split(/,\s*/).map(o => {
          const priceMatch = o.match(/(.+?)\s*\+?\s*£([\d.]+)/)
          if (priceMatch) {
            return { name: priceMatch[1].trim(), price: parseFloat(priceMatch[2]) }
          }
          return { name: o.trim(), price: 0 }
        })
        
        if (!currentItem.optionGroups) currentItem.optionGroups = []
        currentItem.optionGroups.push({
          name: groupName,
          is_required: true,
          min_selections: count,
          max_selections: count,
          selection_type: count === 1 ? "single" : "multiple",
          options
        })
        continue
      }

      // 5. Parse Optional extras: "Optional toppings max 5: Cheese +£1, Olives +£0.80"
      const optionalMatch = trimmed.match(/^optional\s+(.+?)\s*(?:max\s*(\d+))?:\s*(.+)/i)
      if (optionalMatch && currentItem) {
        const groupName = optionalMatch[1].trim()
        const maxCount = optionalMatch[2] ? parseInt(optionalMatch[2]) : 0
        const optionsStr = optionalMatch[3]
        const options = optionsStr.split(/,\s*/).map(o => {
          const priceMatch = o.match(/(.+?)\s*\+?\s*£([\d.]+)/)
          if (priceMatch) {
            return { name: priceMatch[1].trim(), price: parseFloat(priceMatch[2]) }
          }
          return { name: o.trim(), price: 0 }
        })
        
        if (!currentItem.optionGroups) currentItem.optionGroups = []
        currentItem.optionGroups.push({
          name: groupName.charAt(0).toUpperCase() + groupName.slice(1),
          is_required: false,
          min_selections: 0,
          max_selections: maxCount || options.length,
          selection_type: "multiple",
          options
        })
        continue
      }

      // 6. Parse price at end of line: "£12.99" (standalone price for current item)
      const standalonePriceMatch = trimmed.match(/^£([\d.]+)$/)
      if (standalonePriceMatch && currentItem && !currentItem.price) {
        currentItem.price = parseFloat(standalonePriceMatch[1])
        continue
      }

      // 7. Parse "Item: Name" prefix format
      if (trimmed.toLowerCase().startsWith("item:")) {
        pushCurrentItem()
        currentItem = {
          name: trimmed.replace(/^item:\s*/i, "").trim(),
          category: currentCategory,
          description: "",
          price: 0,
          sizes: [],
          optionGroups: []
        }
        continue
      }

      // 8. Parse "Description:" prefix
      if (trimmed.toLowerCase().startsWith("description:")) {
        if (currentItem) {
          currentItem.description = trimmed.replace(/^description:\s*/i, "").trim()
        }
        continue
      }

      // 9. Parse old-style price prefixes: "Regular: £6.99"
      const oldPriceMatch = trimmed.match(/^(regular|medium|large|small):\s*£?([\d.]+)/i)
      if (oldPriceMatch && currentItem) {
        if (!currentItem.sizes) currentItem.sizes = []
        currentItem.sizes.push({
          name: oldPriceMatch[1].charAt(0).toUpperCase() + oldPriceMatch[1].slice(1).toLowerCase(),
          price: parseFloat(oldPriceMatch[2])
        })
        if (!currentItem.price) {
          currentItem.price = parseFloat(oldPriceMatch[2])
        }
        continue
      }

      // 10. Parse "Name - £X.XX" or "Name £X.XX" (new item with inline price)
      const inlinePriceMatch = trimmed.match(/^(.+?)\s*[-–]\s*£([\d.]+)$/) || trimmed.match(/^(.+?)\s+£([\d.]+)$/)
      if (inlinePriceMatch && !trimmed.includes(":")) {
        pushCurrentItem()
        currentItem = {
          name: inlinePriceMatch[1].trim(),
          category: currentCategory,
          description: "",
          price: parseFloat(inlinePriceMatch[2]),
          sizes: [],
          optionGroups: []
        }
        continue
      }

      // 11. Check if this is a new item name (no colon, no price, not empty, not a modifier)
      // This handles lines like "Family Meal" or "Margherita Pizza"
      const isModifierLine = /^(choose|optional|sizes?|description|regular|medium|large|small):/i.test(trimmed)
      const hasInlinePrice = /£[\d.]+/.test(trimmed)
      
      if (!isModifierLine && !hasInlinePrice && !trimmed.includes(":") && trimmed.length > 0) {
        // Check if next line has modifiers or prices - if so, this is an item name
        const nextLine = lines[i + 1]?.trim() || ""
        const nextIsModifier = /^(choose|optional|sizes?|description|£[\d.]+)/i.test(nextLine)
        const nextIsEmpty = !nextLine
        const nextIsNewCategory = /^\*\*.+\*\*$/.test(nextLine) || /^##/.test(nextLine)
        
        if (nextIsModifier || nextIsEmpty || nextIsNewCategory || /^£/.test(nextLine)) {
          pushCurrentItem()
          currentItem = {
            name: trimmed,
            category: currentCategory,
            description: "",
            price: 0,
            sizes: [],
            optionGroups: []
          }
          continue
        }
        
        // Otherwise, treat as description for current item
        if (currentItem && !currentItem.description) {
          currentItem.description = trimmed
          continue
        }
      }

      // 12. Any other text - could be description
      if (currentItem && !currentItem.description && trimmed.length > 0) {
        currentItem.description = trimmed
      }
    }
    
    pushCurrentItem()
    setParsedItems(parsed)
    if (warnings.length > 0) {
      console.log("[v0] Import warnings:", warnings)
    }
  }

  // Parse table format
  const parseTableMenu = () => {
    const lines = tableText.split("\n").filter(l => l.trim())
    const parsed: any[] = []
    
    for (const line of lines) {
      // Split by tab or multiple spaces or pipe
      const cols = line.split(/\t|\s{2,}|\|/).map(c => c.trim()).filter(Boolean)
      
      if (cols.length >= 3) {
        // Format: Category | Name | Description | Regular | Medium | Large
        // Or: Category | Subcategory | Name | Description | Prices...
        parsed.push({
          category: cols[0] || "",
          subcategory: cols.length > 5 ? cols[1] : "",
          name: cols.length > 5 ? cols[2] : cols[1],
          description: cols.length > 5 ? cols[3] : (cols[2] || ""),
          regular_price: parseFloat(cols[cols.length >= 6 ? 4 : 3]?.replace(/[£$€]/g, "")) || 0,
          medium_price: cols.length >= 5 ? parseFloat(cols[cols.length >= 6 ? 5 : 4]?.replace(/[£$€]/g, "")) || null : null,
          large_price: cols.length >= 6 ? parseFloat(cols[5]?.replace(/[£$€]/g, "")) || null : null,
        })
      }
    }
    
    setParsedItems(parsed)
  }

  // Import parsed items with option groups
  const importParsedItems = async () => {
    if (parsedItems.length === 0) return
    setImporting(true)
    
    try {
      // First, create any new categories
      const categoryNames = [...new Set(parsedItems.map(p => p.category).filter(Boolean))]
      const categoryMap: Record<string, string> = {}
      
      for (const catName of categoryNames) {
        const existing = categories.find(c => c.name.toLowerCase() === catName.toLowerCase())
        if (existing) {
          categoryMap[catName] = existing.id
        } else {
          const res = await fetch(`/api/customer/sites/${siteId}/menu/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: catName }),
          })
          if (res.ok) {
            const data = await res.json()
            categoryMap[catName] = data.category.id
          }
        }
      }
      
      // Create menu items with variants and option groups
      for (const item of parsedItems) {
        // Build variants from sizes
        const variants: { name: string; price: number; is_default: boolean }[] = []
        if (item.sizes && item.sizes.length > 0) {
          item.sizes.forEach((size: any, idx: number) => {
            variants.push({
              name: size.name,
              price: size.price,
              is_default: idx === 0
            })
          })
        }
        
        // Create the menu item
        const itemRes = await fetch(`/api/customer/sites/${siteId}/menu/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            description: item.description || "",
            price: item.price || (item.sizes?.[0]?.price) || 0,
            category_id: categoryMap[item.category] || null,
            is_available: true,
            variants: variants.length > 1 ? variants : [],
          }),
        })
        
        if (!itemRes.ok) continue
        const itemData = await itemRes.json()
        const itemId = itemData.item?.id
        
        // Create option groups for this item
        if (item.optionGroups && item.optionGroups.length > 0 && itemId) {
          for (const group of item.optionGroups) {
            // Create the addon group
            const groupRes = await fetch(`/api/customer/sites/${siteId}/menu/addon-groups`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: group.name,
                description: "",
                is_required: group.is_required,
                min_selections: group.min_selections,
                max_selections: group.max_selections,
                selection_type: group.selection_type,
                addons: group.options.map((opt: any, idx: number) => ({
                  name: opt.name,
                  price: opt.price || 0,
                  is_available: true,
                  display_order: idx
                }))
              }),
            })
            
            if (!groupRes.ok) continue
            const groupData = await groupRes.json()
            const groupId = groupData.addonGroup?.id
            
            // Link the group to the item
            if (groupId) {
              await fetch(`/api/customer/sites/${siteId}/menu/items/${itemId}/addon-groups`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ addon_group_id: groupId }),
              })
            }
          }
        }
      }
      
      fetchData()
      setShowImportDialog(false)
      setParsedItems([])
      setPasteText("")
      setTableText("")
    } catch (error) {
      console.error("Failed to import items:", error)
    } finally {
      setImporting(false)
    }
  }

  // Handle file upload (PDF/Image)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const res = await fetch(`/api/customer/sites/${siteId}/menu/import-file`, {
        method: "POST",
        body: formData,
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.parsed) {
          setParsedItems(data.parsed)
        } else {
          // Show pending review message
          alert("File uploaded! Our team will review and import your menu within 24-48 hours.")
          setShowImportDialog(false)
        }
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
    } finally {
      setUploadingFile(false)
    }
  }

  // Category handlers
  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        image_url: category.image_url || "",
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: "", description: "", image_url: "" })
    }
    setShowCategoryDialog(true)
  }

  const saveCategory = async () => {
    setSaving(true)
    try {
      const url = editingCategory 
        ? `/api/customer/sites/${siteId}/menu/categories/${editingCategory.id}`
        : `/api/customer/sites/${siteId}/menu/categories`
      
      const res = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      })
      
      if (res.ok) {
        fetchData()
        setShowCategoryDialog(false)
      }
    } catch (error) {
      console.error("Failed to save category:", error)
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Items will be moved to uncategorized.")) return
    try {
      await fetch(`/api/customer/sites/${siteId}/menu/categories/${id}`, { method: "DELETE" })
      fetchData()
    } catch (error) {
      console.error("Failed to delete category:", error)
    }
  }

  // Item handlers
  const openItemDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item)
      setItemForm({
        ...item,
        variants: item.variants || [],
      })
    } else {
      setEditingItem(null)
      setItemForm({
        name: "",
        description: "",
        price: 0,
        category_id: selectedCategory || "",
        is_available: true,
        is_featured: false,
        is_new: false,
        is_popular: false,
        spice_level: 0,
        dietary_labels: [],
        allergens: [],
        variants: [],
      })
    }
    setShowItemDialog(true)
  }

  const saveItem = async () => {
    setSaving(true)
    try {
      const url = editingItem 
        ? `/api/customer/sites/${siteId}/menu/items/${editingItem.id}`
        : `/api/customer/sites/${siteId}/menu/items`
      
      const res = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemForm),
      })
      
      if (res.ok) {
        fetchData()
        setShowItemDialog(false)
      }
    } catch (error) {
      console.error("Failed to save item:", error)
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return
    try {
      await fetch(`/api/customer/sites/${siteId}/menu/items/${id}`, { method: "DELETE" })
      fetchData()
    } catch (error) {
      console.error("Failed to delete item:", error)
    }
  }

  const duplicateItem = async (item: MenuItem) => {
    try {
      await fetch(`/api/customer/sites/${siteId}/menu/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          name: `${item.name} (Copy)`,
          id: undefined,
        }),
      })
      fetchData()
    } catch (error) {
      console.error("Failed to duplicate item:", error)
    }
  }

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      await fetch(`/api/customer/sites/${siteId}/menu/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, is_available: !item.is_available }),
      })
      fetchData()
    } catch (error) {
      console.error("Failed to toggle availability:", error)
    }
  }

  // Addon Group handlers
  const openAddonGroupDialog = (group?: AddonGroup) => {
    if (group) {
      setEditingAddonGroup(group)
      setAddonGroupForm({
        name: group.name,
        description: group.description || "",
        selection_type: group.selection_type,
        min_selections: group.min_selections,
        max_selections: group.max_selections || 10,
        is_required: group.is_required,
        addons: group.addons.map(a => ({ name: a.name, price: a.price })),
      })
    } else {
      setEditingAddonGroup(null)
      setAddonGroupForm({
        name: "",
        description: "",
        selection_type: "multiple",
        min_selections: 0,
        max_selections: 10,
        is_required: false,
        addons: [],
      })
    }
    setShowAddonGroupDialog(true)
  }

  const saveAddonGroup = async () => {
    setSaving(true)
    try {
      const url = editingAddonGroup 
        ? `/api/customer/sites/${siteId}/menu/addon-groups/${editingAddonGroup.id}`
        : `/api/customer/sites/${siteId}/menu/addon-groups`
      
      const res = await fetch(url, {
        method: editingAddonGroup ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addonGroupForm),
      })
      
      if (res.ok) {
        fetchData()
        setShowAddonGroupDialog(false)
      }
    } catch (error) {
      console.error("Failed to save addon group:", error)
    } finally {
      setSaving(false)
    }
  }

  const deleteAddonGroup = async (id: string) => {
    if (!confirm("Delete this addon group?")) return
    try {
      await fetch(`/api/customer/sites/${siteId}/menu/addon-groups/${id}`, { method: "DELETE" })
      fetchData()
    } catch (error) {
      console.error("Failed to delete addon group:", error)
    }
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Render spice level
  const renderSpiceLevel = (level: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Flame 
            key={i} 
            className={cn(
              "w-3 h-3",
              i <= level ? "text-red-500 fill-red-500" : "text-gray-300"
            )} 
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Menu Builder</h1>
          <p className="text-muted-foreground">Create and manage your menu items, categories, and customizations</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Menu
          </Button>
          <Button variant="outline" onClick={() => openCategoryDialog()}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={() => openItemDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Menu Items ({items.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
          <TabsTrigger value="addons">Addon Groups ({addonGroups.length})</TabsTrigger>
        </TabsList>

        {/* Menu Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No menu items yet</h3>
              <p className="text-muted-foreground mb-4">Start building your menu by adding your first item</p>
              <Button onClick={() => openItemDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className={cn(
                      "overflow-hidden transition-all hover:shadow-md",
                      !item.is_available && "opacity-60"
                    )}>
                      {/* Item Image */}
                      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {item.is_featured && <Badge className="bg-yellow-500">Featured</Badge>}
                          {item.is_new && <Badge className="bg-green-500">New</Badge>}
                          {item.is_popular && <Badge className="bg-orange-500">Popular</Badge>}
                          {!item.is_available && <Badge variant="destructive">Unavailable</Badge>}
                        </div>
                        
                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openItemDialog(item)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateItem(item)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleItemAvailability(item)}>
                              {item.is_available ? (
                                <>
                                  <X className="w-4 h-4 mr-2" />
                                  Mark Unavailable
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark Available
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-primary">
                            £{Number(item.price).toFixed(2)}
                          </span>
                          {item.compare_price && (
                            <span className="text-sm text-muted-foreground line-through">
                              £{Number(item.compare_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {item.spice_level > 0 && renderSpiceLevel(item.spice_level)}
                          {item.calories && (
                            <span className="text-muted-foreground">{item.calories} cal</span>
                          )}
                          {item.prep_time_minutes && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {item.prep_time_minutes}m
                            </span>
                          )}
                        </div>
                        
                        {/* Dietary Labels */}
                        {item.dietary_labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.dietary_labels.map(label => {
                              const opt = DIETARY_OPTIONS.find(o => o.value === label)
                              return (
                                <Badge key={label} variant="outline" className="text-xs">
                                  {opt?.icon} {opt?.label || label}
                                </Badge>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
          
          {categories.length === 0 ? (
            <Card className="p-12 text-center">
              <FolderPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">Organize your menu by creating categories</p>
              <Button onClick={() => openCategoryDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Category
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {categories.map((cat, index) => (
                <Card key={cat.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <FolderPlus className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{cat.name}</h3>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground">{cat.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {items.filter(i => i.category_id === cat.id).length} items
                      </p>
                    </div>
                    
                    <Switch checked={cat.is_active} />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openCategoryDialog(cat)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteCategory(cat.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Addon Groups Tab */}
        <TabsContent value="addons" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openAddonGroupDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Addon Group
            </Button>
          </div>
          
          {addonGroups.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No addon groups yet</h3>
              <p className="text-muted-foreground mb-4">Create addon groups for toppings, extras, and customizations</p>
              <Button onClick={() => openAddonGroupDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Addon Group
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {addonGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        {group.description && (
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAddonGroupDialog(group)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteAddonGroup(group.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {group.selection_type === "single" ? "Single Select" : "Multiple Select"}
                      </Badge>
                      {group.is_required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {group.addons.slice(0, 5).map((addon) => (
                        <div key={addon.id} className="flex items-center justify-between text-sm">
                          <span>{addon.name}</span>
                          {addon.price > 0 && (
                            <span className="text-muted-foreground">+£{Number(addon.price).toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                      {group.addons.length > 5 && (
                        <p className="text-xs text-muted-foreground">+{group.addons.length - 5} more options</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>Organize your menu items into categories</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Starters, Main Course, Desserts"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Brief description of this category"
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={categoryForm.image_url}
                onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
              <Button onClick={saveCategory} disabled={saving || !categoryForm.name}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCategory ? "Save Changes" : "Add Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            <DialogDescription>Add details for your menu item</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Item Name *</Label>
                <Input
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g., Chicken Tikka Masala"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Describe your dish..."
                />
              </div>
              <div>
                <Label>Price (£) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Compare Price (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemForm.compare_price || ""}
                  onChange={(e) => setItemForm({ ...itemForm, compare_price: parseFloat(e.target.value) || undefined })}
                  placeholder="Original price for sale items"
                />
              </div>
            </div>

            {/* Size Variants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Size Variants (optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const variants = itemForm.variants || []
                    if (variants.length === 0) {
                      setItemForm({
                        ...itemForm,
                        variants: [
                          { id: "", name: "Regular", price: itemForm.price || 0, is_default: true, display_order: 0 },
                          { id: "", name: "Medium", price: 0, is_default: false, display_order: 1 },
                          { id: "", name: "Large", price: 0, is_default: false, display_order: 2 },
                        ]
                      })
                    } else {
                      setItemForm({
                        ...itemForm,
                        variants: [...variants, { id: "", name: "", price: 0, is_default: false, display_order: variants.length }]
                      })
                    }
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {(itemForm.variants?.length || 0) === 0 ? "Add Sizes" : "Add Variant"}
                </Button>
              </div>
              {(itemForm.variants?.length || 0) > 0 && (
                <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                  {itemForm.variants?.map((variant, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={variant.name}
                        onChange={(e) => {
                          const newVariants = [...(itemForm.variants || [])]
                          newVariants[idx] = { ...newVariants[idx], name: e.target.value }
                          setItemForm({ ...itemForm, variants: newVariants })
                        }}
                        placeholder="Size name (e.g., Regular, Medium, Large)"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => {
                          const newVariants = [...(itemForm.variants || [])]
                          newVariants[idx] = { ...newVariants[idx], price: parseFloat(e.target.value) || 0 }
                          setItemForm({ ...itemForm, variants: newVariants })
                        }}
                        placeholder="Price"
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant={variant.is_default ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newVariants = (itemForm.variants || []).map((v, i) => ({
                            ...v,
                            is_default: i === idx
                          }))
                          setItemForm({ ...itemForm, variants: newVariants })
                        }}
                      >
                        Default
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newVariants = (itemForm.variants || []).filter((_, i) => i !== idx)
                          setItemForm({ ...itemForm, variants: newVariants })
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select
                  value={itemForm.category_id || "none"}
                  onValueChange={(v) => setItemForm({ ...itemForm, category_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={itemForm.image_url || ""}
                  onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Spice Level */}
            <div>
              <Label>Spice Level</Label>
              <div className="flex items-center gap-2 mt-2">
                {[0, 1, 2, 3, 4, 5].map(level => (
                  <Button
                    key={level}
                    type="button"
                    variant={itemForm.spice_level === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setItemForm({ ...itemForm, spice_level: level })}
                  >
                    {level === 0 ? "None" : (
                      <div className="flex">
                        {Array(level).fill(0).map((_, i) => (
                          <Flame key={i} className="w-3 h-3 text-red-500" />
                        ))}
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Dietary Labels */}
            <div>
              <Label>Dietary Labels</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIETARY_OPTIONS.map(opt => (
                  <Badge
                    key={opt.value}
                    variant={itemForm.dietary_labels?.includes(opt.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const labels = itemForm.dietary_labels || []
                      setItemForm({
                        ...itemForm,
                        dietary_labels: labels.includes(opt.value)
                          ? labels.filter(l => l !== opt.value)
                          : [...labels, opt.value]
                      })
                    }}
                  >
                    {opt.icon} {opt.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div>
              <Label>Allergens</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALLERGEN_OPTIONS.map(allergen => (
                  <Badge
                    key={allergen}
                    variant={itemForm.allergens?.includes(allergen) ? "destructive" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const allergens = itemForm.allergens || []
                      setItemForm({
                        ...itemForm,
                        allergens: allergens.includes(allergen)
                          ? allergens.filter(a => a !== allergen)
                          : [...allergens, allergen]
                      })
                    }}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={itemForm.calories || ""}
                  onChange={(e) => setItemForm({ ...itemForm, calories: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 450"
                />
              </div>
              <div>
                <Label>Prep Time (minutes)</Label>
                <Input
                  type="number"
                  value={itemForm.prep_time_minutes || ""}
                  onChange={(e) => setItemForm({ ...itemForm, prep_time_minutes: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 15"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Available</Label>
                  <p className="text-xs text-muted-foreground">Show on menu</p>
                </div>
                <Switch
                  checked={itemForm.is_available}
                  onCheckedChange={(v) => setItemForm({ ...itemForm, is_available: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Featured</Label>
                  <p className="text-xs text-muted-foreground">Highlight this item</p>
                </div>
                <Switch
                  checked={itemForm.is_featured}
                  onCheckedChange={(v) => setItemForm({ ...itemForm, is_featured: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>New</Label>
                  <p className="text-xs text-muted-foreground">Show NEW badge</p>
                </div>
                <Switch
                  checked={itemForm.is_new}
                  onCheckedChange={(v) => setItemForm({ ...itemForm, is_new: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Popular</Label>
                  <p className="text-xs text-muted-foreground">Show POPULAR badge</p>
                </div>
                <Switch
                  checked={itemForm.is_popular}
                  onCheckedChange={(v) => setItemForm({ ...itemForm, is_popular: v })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
              <Button onClick={saveItem} disabled={saving || !itemForm.name || !itemForm.price}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Addon Group Dialog */}
      <Dialog open={showAddonGroupDialog} onOpenChange={setShowAddonGroupDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAddonGroup ? "Edit Addon Group" : "Add Addon Group"}</DialogTitle>
            <DialogDescription>Create customization options like toppings, extras, or sauces</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Name *</Label>
              <Input
                value={addonGroupForm.name}
                onChange={(e) => setAddonGroupForm({ ...addonGroupForm, name: e.target.value })}
                placeholder="e.g., Extra Toppings, Choose Your Sauce"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={addonGroupForm.description}
                onChange={(e) => setAddonGroupForm({ ...addonGroupForm, description: e.target.value })}
                placeholder="e.g., Add extra toppings to your pizza"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Selection Type</Label>
                <Select
                  value={addonGroupForm.selection_type}
                  onValueChange={(v) => setAddonGroupForm({ ...addonGroupForm, selection_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single (Radio)</SelectItem>
                    <SelectItem value="multiple">Multiple (Checkbox)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={addonGroupForm.is_required}
                    onCheckedChange={(v) => setAddonGroupForm({ ...addonGroupForm, is_required: v })}
                  />
                  <Label>Required</Label>
                </div>
              </div>
            </div>

            {/* Min/Max Selections */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Minimum Selections</Label>
                <Input
                  type="number"
                  min="0"
                  value={addonGroupForm.min_selections || 0}
                  onChange={(e) => setAddonGroupForm({ ...addonGroupForm, min_selections: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {addonGroupForm.is_required ? "Customer must choose at least this many" : "Optional, 0 for no minimum"}
                </p>
              </div>
              <div>
                <Label>Maximum Selections</Label>
                <Input
                  type="number"
                  min="1"
                  value={addonGroupForm.max_selections || ""}
                  onChange={(e) => setAddonGroupForm({ ...addonGroupForm, max_selections: e.target.value ? parseInt(e.target.value) : 0 })}
                  placeholder="Unlimited"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited
                </p>
              </div>
            </div>

            {/* Selection Preview Message */}
            {addonGroupForm.is_required && addonGroupForm.min_selections > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Customer will see:</strong> &quot;Please choose {addonGroupForm.min_selections === addonGroupForm.max_selections 
                    ? addonGroupForm.min_selections 
                    : addonGroupForm.max_selections 
                      ? `${addonGroupForm.min_selections}-${addonGroupForm.max_selections}`
                      : `at least ${addonGroupForm.min_selections}`
                  } {addonGroupForm.name.toLowerCase() || "option(s)"}&quot;
                </p>
              </div>
            )}

            {/* Addon Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddonGroupForm({
                    ...addonGroupForm,
                    addons: [...addonGroupForm.addons, { name: "", price: 0 }]
                  })}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {addonGroupForm.addons.map((addon, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={addon.name}
                      onChange={(e) => {
                        const newAddons = [...addonGroupForm.addons]
                        newAddons[idx].name = e.target.value
                        setAddonGroupForm({ ...addonGroupForm, addons: newAddons })
                      }}
                      placeholder="Option name"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={addon.price}
                      onChange={(e) => {
                        const newAddons = [...addonGroupForm.addons]
                        newAddons[idx].price = parseFloat(e.target.value) || 0
                        setAddonGroupForm({ ...addonGroupForm, addons: newAddons })
                      }}
                      placeholder="Price"
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newAddons = addonGroupForm.addons.filter((_, i) => i !== idx)
                        setAddonGroupForm({ ...addonGroupForm, addons: newAddons })
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {addonGroupForm.addons.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No options yet. Click "Add Option" to create addon choices.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddonGroupDialog(false)}>Cancel</Button>
              <Button onClick={saveAddonGroup} disabled={saving || !addonGroupForm.name}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAddonGroup ? "Save Changes" : "Add Group"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Menu Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Menu</DialogTitle>
            <DialogDescription>
              Quickly add menu items by pasting text, importing a table, or uploading a file
            </DialogDescription>
          </DialogHeader>
          
          {/* Import Mode Tabs */}
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant={importMode === "paste" ? "default" : "outline"}
              size="sm"
              onClick={() => setImportMode("paste")}
            >
              <ClipboardPaste className="w-4 h-4 mr-2" />
              Paste Menu
            </Button>
            <Button
              variant={importMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setImportMode("table")}
            >
              <Table className="w-4 h-4 mr-2" />
              Table Import
            </Button>
            <Button
              variant={importMode === "file" ? "default" : "outline"}
              size="sm"
              onClick={() => setImportMode("file")}
            >
              <FileImage className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>

          {/* Paste Mode */}
          {importMode === "paste" && (
            <div className="space-y-4">
              <div>
                <Label>Paste your menu text</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Use **Category** headers, sizes, &quot;Choose X&quot; for required options, &quot;Optional&quot; for extras
                </p>
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`**Meal Deals**
Family Meal
2 pcs chicken grill
Choose 2: Leg, Thigh, Breast
Choose 1 Drink: Pepsi, 7Up, Mirinda, Coke
£12.99

**Pizza**
Margherita Pizza
Sizes: 10 inch £6.99, 12 inch £8.99, 15 inch £10.99
Optional toppings max 5: Cheese +£1, Olives +£0.80, Chicken +£1.50
Classic cheese and tomato pizza

Pepperoni Pizza
Sizes: 10 inch £7.99, 12 inch £9.99, 15 inch £11.99
With pepperoni and cheese`}
                  className="min-h-[250px] font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={parsePastedMenu} disabled={!pasteText.trim()}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Items
                </Button>
                <p className="text-xs text-muted-foreground">
                  Detects categories, sizes, required choices, optional extras
                </p>
              </div>
            </div>
          )}

          {/* Table Mode */}
          {importMode === "table" && (
            <div className="space-y-4">
              <div>
                <Label>Paste table data</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Columns: Category | Name | Description | Regular Price | Medium Price | Large Price
                </p>
                <Textarea
                  value={tableText}
                  onChange={(e) => setTableText(e.target.value)}
                  placeholder={`Pizza	Margherita	Cheese and tomato	6.99	8.99	10.99
Pizza	Pepperoni	Pepperoni and cheese	7.99	9.99	11.99
Burgers	Classic Burger	Beef patty with lettuce	5.99		
Burgers	Cheese Burger	With melted cheese	6.49`}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              <Button onClick={parseTableMenu} disabled={!tableText.trim()}>
                <Eye className="w-4 h-4 mr-2" />
                Preview Items
              </Button>
            </div>
          )}

          {/* File Upload Mode */}
          {importMode === "file" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileImage className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Upload Menu File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  PDF, Image (JPG, PNG), or Word document
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="menu-file-upload"
                />
                <Button asChild disabled={uploadingFile}>
                  {uploadingFile ? (
                    <span>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <label htmlFor="menu-file-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </label>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  If automatic extraction is not possible, your menu will be queued for manual review by our team.
                </p>
              </div>
            </div>
          )}

          {/* Parsed Items Preview */}
          {parsedItems.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              {/* Summary Stats */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Review Import</h3>
                  <p className="text-sm text-muted-foreground">
                    {parsedItems.length} items, {[...new Set(parsedItems.map(p => p.category).filter(Boolean))].length} categories, {parsedItems.reduce((acc, p) => acc + (p.optionGroups?.length || 0), 0)} option groups
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setParsedItems([])}>
                  Clear
                </Button>
              </div>

              {/* Category Summary */}
              <div className="flex flex-wrap gap-2">
                {[...new Set(parsedItems.map(p => p.category).filter(Boolean))].map((cat, idx) => (
                  <Badge key={idx} variant="secondary">{cat}</Badge>
                ))}
              </div>

              {/* Items List */}
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                {parsedItems.map((item, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-3">
                      {/* Item Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          {item.category && (
                            <Badge variant="outline" className="mb-1 text-xs">{item.category}</Badge>
                          )}
                          <h4 className="font-semibold">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {item.price > 0 && !item.sizes?.length && (
                            <span className="font-semibold text-green-600">£{item.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      {/* Sizes */}
                      {item.sizes && item.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.sizes.map((size: any, sIdx: number) => (
                            <Badge key={sIdx} variant="secondary" className="text-xs">
                              {size.name}: £{size.price.toFixed(2)}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Option Groups */}
                      {item.optionGroups && item.optionGroups.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          {item.optionGroups.map((group: any, gIdx: number) => (
                            <div key={gIdx} className="text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant={group.is_required ? "destructive" : "outline"} className="text-xs">
                                  {group.is_required ? "Required" : "Optional"}
                                </Badge>
                                <span className="font-medium">{group.name}</span>
                                <span className="text-muted-foreground">
                                  ({group.min_selections === group.max_selections 
                                    ? `Choose ${group.min_selections}` 
                                    : group.min_selections > 0 
                                      ? `${group.min_selections}-${group.max_selections}` 
                                      : `Up to ${group.max_selections}`})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1 ml-4">
                                {group.options.map((opt: any, oIdx: number) => (
                                  <span key={oIdx} className="text-xs text-muted-foreground">
                                    {opt.name}{opt.price > 0 && <span className="text-green-600"> +£{opt.price.toFixed(2)}</span>}
                                    {oIdx < group.options.length - 1 && ", "}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Import Actions */}
              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Review items above before importing
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
                  <Button onClick={importParsedItems} disabled={importing}>
                    {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Import {parsedItems.length} Items
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
