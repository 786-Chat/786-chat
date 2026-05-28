"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  X, 
  Plus, 
  Minus, 
  Flame, 
  Leaf, 
  Info,
  ShoppingBag,
  Clock,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  compare_price: number | null
  image_url: string | null
  category_id?: string | null
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  is_popular: boolean
  spice_level: number
  calories: number | null
  prep_time_minutes: number | null
  dietary_labels: string[]
  allergens: string[]
  ingredients?: string | null
  variants: Array<{
    id: string
    name: string
    price: number
    is_default: boolean
  }>
}

interface AddonGroup {
  id: string
  name: string
  description: string | null
  selection_type: "single" | "multiple"
  min_selections: number
  max_selections: number | null
  is_required: boolean
  addons: Array<{
    id: string
    name: string
    price: number
    is_available: boolean
  }>
}

interface SelectedAddon {
  id: string
  name: string
  price: number
  groupName: string
}

interface ItemCustomizationModalProps {
  item: MenuItem
  addonGroups: AddonGroup[]
  primaryColor: string
  onClose: () => void
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedVariant?: { id: string; name: string; price: number },
    selectedAddons?: SelectedAddon[],
    specialInstructions?: string
  ) => void
}

export function ItemCustomizationModal({
  item,
  addonGroups,
  primaryColor,
  onClose,
  onAddToCart
}: ItemCustomizationModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<{ id: string; name: string; price: number } | undefined>(
    item.variants?.find(v => v.is_default) || item.variants?.[0]
  )
  const [selectedAddons, setSelectedAddons] = useState<Map<string, SelectedAddon[]>>(new Map())
  const [specialInstructions, setSpecialInstructions] = useState("")

  // Calculate total price
  const basePrice = selectedVariant ? Number(selectedVariant.price) : Number(item.price)
  const addonsPrice = Array.from(selectedAddons.values())
    .flat()
    .reduce((sum, addon) => sum + Number(addon.price), 0)
  const totalPrice = (basePrice + addonsPrice) * quantity

  // Handle variant selection
  const handleVariantChange = (variantId: string) => {
    const variant = item.variants?.find(v => v.id === variantId)
    if (variant) {
      setSelectedVariant({ id: variant.id, name: variant.name, price: variant.price })
    }
  }

  // Handle addon toggle
  const handleAddonToggle = (group: AddonGroup, addon: { id: string; name: string; price: number }) => {
    setSelectedAddons(prev => {
      const newMap = new Map(prev)
      const groupAddons = newMap.get(group.id) || []
      
      if (group.selection_type === "single") {
        // Radio - replace selection
        newMap.set(group.id, [{ ...addon, groupName: group.name }])
      } else {
        // Checkbox - toggle
        const existingIndex = groupAddons.findIndex(a => a.id === addon.id)
        if (existingIndex >= 0) {
          // Remove
          const updated = groupAddons.filter(a => a.id !== addon.id)
          if (updated.length === 0) {
            newMap.delete(group.id)
          } else {
            newMap.set(group.id, updated)
          }
        } else {
          // Add (check max)
          if (!group.max_selections || groupAddons.length < group.max_selections) {
            newMap.set(group.id, [...groupAddons, { ...addon, groupName: group.name }])
          }
        }
      }
      
      return newMap
    })
  }

  // Check if addon is selected
  const isAddonSelected = (groupId: string, addonId: string) => {
    const groupAddons = selectedAddons.get(groupId) || []
    return groupAddons.some(a => a.id === addonId)
  }

  // Validate required groups
  const validateRequiredGroups = () => {
    for (const group of addonGroups) {
      if (group.is_required) {
        const groupAddons = selectedAddons.get(group.id) || []
        if (groupAddons.length < group.min_selections) {
          return false
        }
      }
    }
    return true
  }

  // Get validation message for a group
  const getGroupValidationMessage = (group: AddonGroup) => {
    const groupAddons = selectedAddons.get(group.id) || []
    const currentCount = groupAddons.length
    const min = group.min_selections || 0
    const max = group.max_selections
    
    if (group.is_required && currentCount < min) {
      if (min === max) {
        return `Please choose ${min} ${group.name.toLowerCase()}`
      }
      return `Please choose ${min}${max ? `-${max}` : " or more"} ${group.name.toLowerCase()}`
    }
    
    if (max && currentCount >= max) {
      return `Maximum ${max} selections reached`
    }
    
    return null
  }

  // Check if group is complete (for visual feedback)
  const isGroupComplete = (group: AddonGroup) => {
    const groupAddons = selectedAddons.get(group.id) || []
    const currentCount = groupAddons.length
    const min = group.min_selections || 0
    
    if (!group.is_required) return true
    return currentCount >= min
  }

  // Handle add to cart
  const handleAddToCart = () => {
    if (!validateRequiredGroups()) {
      return
    }
    
    const allAddons = Array.from(selectedAddons.values()).flat()
    onAddToCart(item, quantity, selectedVariant, allAddons, specialInstructions || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="relative h-48 sm:h-56 flex-shrink-0">
          {item.image_url ? (
            <Image 
              src={item.image_url} 
              alt={item.name} 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-gray-300" />
            </div>
          )}
          {item.is_new && (
            <Badge 
              className="absolute top-4 left-4 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              New
            </Badge>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-5">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              {item.description && (
                <p className="text-gray-600 mt-1">{item.description}</p>
              )}
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {item.spice_level > 0 && (
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                    {Array.from({ length: item.spice_level }).map((_, i) => (
                      <Flame key={i} className="w-3 h-3" />
                    ))}
                    <span className="ml-1">Spicy</span>
                  </Badge>
                )}
                {item.dietary_labels?.map(label => (
                  <Badge key={label} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {label === "Vegetarian" && <Leaf className="w-3 h-3 mr-1" />}
                    {label}
                  </Badge>
                ))}
                {item.calories && (
                  <Badge variant="outline">{item.calories} cal</Badge>
                )}
                {item.prep_time_minutes && (
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.prep_time_minutes} min
                  </Badge>
                )}
              </div>

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Allergen Information</p>
                      <p className="text-sm text-amber-700">
                        Contains: {item.allergens.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Size/Variants */}
            {item.variants && item.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Choose Size</h3>
                <RadioGroup 
                  value={selectedVariant?.id} 
                  onValueChange={handleVariantChange}
                  className="space-y-2"
                >
                  {item.variants.map(variant => (
                    <label
                      key={variant.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors",
                        selectedVariant?.id === variant.id 
                          ? "border-current bg-primary/5" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={selectedVariant?.id === variant.id ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={variant.id} className="sr-only" />
                        <div 
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            selectedVariant?.id === variant.id ? "border-current" : "border-gray-300"
                          )}
                          style={selectedVariant?.id === variant.id ? { borderColor: primaryColor } : {}}
                        >
                          {selectedVariant?.id === variant.id && (
                            <div 
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: primaryColor }}
                            />
                          )}
                        </div>
                        <span className="font-medium">{variant.name}</span>
                      </div>
                      <span className="font-semibold" style={{ color: primaryColor }}>
                        £{Number(variant.price).toFixed(2)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Addon Groups */}
            {addonGroups.map(group => {
              const groupAddons = selectedAddons.get(group.id) || []
              const currentCount = groupAddons.length
              const validationMessage = getGroupValidationMessage(group)
              const isComplete = isGroupComplete(group)
              
              return (
                <div key={group.id} className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {group.name}
                        {group.is_required && isComplete && (
                          <span className="text-green-500 text-sm">✓</span>
                        )}
                      </h3>
                      {group.description && (
                        <p className="text-sm text-gray-500">{group.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {group.is_required && (
                        <Badge variant="outline" className={cn(
                          isComplete ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"
                        )}>
                          {isComplete ? "Complete" : "Required"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection count and requirement */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">
                      {group.min_selections > 0 && group.max_selections ? (
                        group.min_selections === group.max_selections 
                          ? `Choose exactly ${group.min_selections}` 
                          : `Choose ${group.min_selections}-${group.max_selections}`
                      ) : group.min_selections > 0 ? (
                        `Choose at least ${group.min_selections}`
                      ) : group.max_selections ? (
                        `Choose up to ${group.max_selections}`
                      ) : null}
                    </p>
                    {(group.min_selections > 0 || group.max_selections) && (
                      <span className={cn(
                        "text-sm font-medium px-2 py-0.5 rounded-full",
                        !group.is_required || isComplete ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-600"
                      )}>
                        {currentCount}/{group.max_selections || "∞"}
                      </span>
                    )}
                  </div>

                  {/* Validation message */}
                  {validationMessage && group.is_required && !isComplete && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {validationMessage}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {group.addons.filter(a => a.is_available).map(addon => (
                      <label
                        key={addon.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors",
                          isAddonSelected(group.id, addon.id)
                            ? "border-current bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        style={isAddonSelected(group.id, addon.id) ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {}}
                      >
                        <div className="flex items-center gap-3">
                          {group.selection_type === "single" ? (
                            <div 
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                isAddonSelected(group.id, addon.id) ? "border-current" : "border-gray-300"
                              )}
                              style={isAddonSelected(group.id, addon.id) ? { borderColor: primaryColor } : {}}
                            >
                              {isAddonSelected(group.id, addon.id) && (
                                <div 
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: primaryColor }}
                                />
                              )}
                            </div>
                          ) : (
                            <Checkbox
                              checked={isAddonSelected(group.id, addon.id)}
                              onCheckedChange={() => handleAddonToggle(group, addon)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              style={{ "--primary": primaryColor } as any}
                            />
                          )}
                          <span className="font-medium">{addon.name}</span>
                        </div>
                        {Number(addon.price) > 0 && (
                          <span className="text-gray-600">+£{Number(addon.price).toFixed(2)}</span>
                        )}
                        <input 
                          type={group.selection_type === "single" ? "radio" : "checkbox"}
                          className="sr-only"
                          checked={isAddonSelected(group.id, addon.id)}
                          onChange={() => handleAddonToggle(group, addon)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Special Instructions */}
            <div className="mb-6">
              <Label htmlFor="instructions" className="font-semibold">Special Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Any special requests? (e.g., no onions, extra sauce)"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="mt-2 resize-none"
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4 bg-white">
          {/* Live Price Breakdown */}
          {(addonsPrice > 0 || (selectedVariant && item.variants && item.variants.length > 1)) && (
            <div className="mb-3 text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Base price{selectedVariant ? ` (${selectedVariant.name})` : ""}</span>
                <span>£{basePrice.toFixed(2)}</span>
              </div>
              {addonsPrice > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>+ Extras</span>
                  <span>+£{addonsPrice.toFixed(2)}</span>
                </div>
              )}
              {quantity > 1 && (
                <div className="flex justify-between text-gray-500">
                  <span>× {quantity}</span>
                  <span></span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t">
                <span>Total</span>
                <span>£{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Validation Summary */}
          {!validateRequiredGroups() && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Please complete all required selections before adding to cart
              </p>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <Button 
              className="flex-1 h-12 text-white font-semibold text-base"
              style={{ backgroundColor: validateRequiredGroups() ? primaryColor : "#9ca3af" }}
              onClick={handleAddToCart}
              disabled={!validateRequiredGroups()}
            >
              {validateRequiredGroups() 
                ? `Add to Order - £${totalPrice.toFixed(2)}`
                : "Complete selections"
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
