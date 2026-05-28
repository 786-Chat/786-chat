"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Eye, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Filter,
  UtensilsCrossed,
  Coffee,
  Drumstick,
  Pizza
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"

// Categories
const CATEGORIES = [
  { value: "all", label: "All Categories", icon: Sparkles },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "cafe", label: "Cafe & Coffee", icon: Coffee },
  { value: "chicken", label: "Chicken Shop", icon: Drumstick },
  { value: "pizza", label: "Pizza Shop", icon: Pizza },
]

// 25 Structurally Different Theme Designs
const THEMES = [
  // ===== RESTAURANT THEMES (5 unique layouts) =====
  {
    id: "fine-dining-luxe",
    name: "Fine Dining Luxe",
    category: "restaurant",
    price: 79.99,
    description: "Elegant luxury restaurant with fullscreen hero and sophisticated menu cards",
    layout: "luxury-fullscreen",
    colors: { bg: "#0a0a0a", primary: "#d4af37", secondary: "#1a1a1a", accent: "#fff8e7", text: "#ffffff" },
    features: ["Fullscreen Hero", "Elegant Menu", "Reservation System", "Chef Profiles"],
  },
  {
    id: "family-diner",
    name: "Family Diner",
    category: "restaurant",
    price: 49.99,
    description: "Warm family restaurant with big food cards and friendly layout",
    layout: "card-grid",
    colors: { bg: "#fef3c7", primary: "#d97706", secondary: "#fffbeb", accent: "#92400e", text: "#1c1917" },
    features: ["Big Food Cards", "Kids Menu", "Family Deals", "Party Bookings"],
  },
  {
    id: "modern-bistro",
    name: "Modern Bistro",
    category: "restaurant",
    price: 59.99,
    description: "Contemporary menu board layout with Instagram-style gallery",
    layout: "menu-board",
    colors: { bg: "#18181b", primary: "#f97316", secondary: "#27272a", accent: "#fed7aa", text: "#fafafa" },
    features: ["Menu Board", "Instagram Feed", "Online Orders", "Reviews"],
  },
  {
    id: "reservation-focus",
    name: "Reserve & Dine",
    category: "restaurant",
    price: 69.99,
    description: "Booking-focused layout with prominent reservation widget",
    layout: "booking-centric",
    colors: { bg: "#1e1b4b", primary: "#818cf8", secondary: "#312e81", accent: "#c4b5fd", text: "#e0e7ff" },
    features: ["Booking Widget", "Table Selection", "Special Events", "Private Dining"],
  },
  {
    id: "gallery-restaurant",
    name: "Visual Feast",
    category: "restaurant",
    price: 64.99,
    description: "Gallery-focused design showcasing beautiful food photography",
    layout: "gallery-focus",
    colors: { bg: "#0c0a09", primary: "#ef4444", secondary: "#1c1917", accent: "#fecaca", text: "#fafaf9" },
    features: ["Photo Gallery", "Chef Story", "Food Blog", "Virtual Tour"],
  },

  // ===== CAFE THEMES (5 unique layouts) =====
  {
    id: "cozy-coffeehouse",
    name: "Cozy Coffeehouse",
    category: "cafe",
    price: 39.99,
    description: "Warm and inviting coffee shop with rustic wooden elements",
    layout: "cozy-rustic",
    colors: { bg: "#1c1917", primary: "#a16207", secondary: "#292524", accent: "#fef3c7", text: "#fafaf9" },
    features: ["Coffee Menu", "Loyalty Cards", "WiFi Info", "Cozy Gallery"],
  },
  {
    id: "pastel-bakery",
    name: "Pastel Bakery",
    category: "cafe",
    price: 44.99,
    description: "Sweet pastel design perfect for bakeries and patisseries",
    layout: "pastel-sweet",
    colors: { bg: "#fdf2f8", primary: "#ec4899", secondary: "#fce7f3", accent: "#9d174d", text: "#1f2937" },
    features: ["Pastry Display", "Custom Cakes", "Gift Cards", "Catering"],
  },
  {
    id: "minimal-white-cafe",
    name: "Minimal White",
    category: "cafe",
    price: 34.99,
    description: "Clean minimalist design with lots of white space",
    layout: "minimal-clean",
    colors: { bg: "#ffffff", primary: "#0f172a", secondary: "#f8fafc", accent: "#64748b", text: "#0f172a" },
    features: ["Clean Layout", "Quick Order", "Seasonal Menu", "Mobile First"],
  },
  {
    id: "dark-espresso",
    name: "Dark Espresso",
    category: "cafe",
    price: 49.99,
    description: "Dark moody theme for specialty coffee bars",
    layout: "dark-moody",
    colors: { bg: "#0c0a09", primary: "#78350f", secondary: "#1c1917", accent: "#d97706", text: "#fafaf9" },
    features: ["Bean Origins", "Brewing Methods", "Coffee Classes", "Subscriptions"],
  },
  {
    id: "brunch-spot",
    name: "Brunch Spot",
    category: "cafe",
    price: 42.99,
    description: "Bright and cheerful brunch menu layout",
    layout: "brunch-bright",
    colors: { bg: "#fffbeb", primary: "#16a34a", secondary: "#fef9c3", accent: "#166534", text: "#1c1917" },
    features: ["Brunch Menu", "Smoothie Bar", "Avocado Toast", "Weekend Specials"],
  },

  // ===== CHICKEN SHOP THEMES (5 unique layouts) =====
  {
    id: "fast-food-order",
    name: "Quick Order",
    category: "chicken",
    price: 54.99,
    description: "Fast food ordering layout with combo meal focus",
    layout: "fast-order",
    colors: { bg: "#fef2f2", primary: "#dc2626", secondary: "#fee2e2", accent: "#fbbf24", text: "#1f2937" },
    features: ["Quick Order", "Combo Deals", "Pickup Timer", "Delivery Tracking"],
  },
  {
    id: "peri-peri-fire",
    name: "Peri Peri Fire",
    category: "chicken",
    price: 49.99,
    description: "Fiery peri peri theme with spice level indicators",
    layout: "spicy-fire",
    colors: { bg: "#1c1917", primary: "#ea580c", secondary: "#292524", accent: "#fdba74", text: "#fafaf9" },
    features: ["Spice Levels", "Flame Effects", "Marinades", "Heat Challenge"],
  },
  {
    id: "fried-chicken-deals",
    name: "Crispy Deals",
    category: "chicken",
    price: 44.99,
    description: "Deal-focused layout with prominent offers and buckets",
    layout: "deals-focus",
    colors: { bg: "#fef9c3", primary: "#ca8a04", secondary: "#fef08a", accent: "#a16207", text: "#1c1917" },
    features: ["Daily Deals", "Bucket Meals", "Family Packs", "Loyalty Points"],
  },
  {
    id: "combo-meal-grid",
    name: "Combo King",
    category: "chicken",
    price: 52.99,
    description: "Grid layout showcasing combo meals and sides",
    layout: "combo-grid",
    colors: { bg: "#18181b", primary: "#f59e0b", secondary: "#27272a", accent: "#fcd34d", text: "#fafafa" },
    features: ["Combo Builder", "Side Options", "Drink Upgrades", "Meal Deals"],
  },
  {
    id: "delivery-chicken",
    name: "Deliver Fast",
    category: "chicken",
    price: 59.99,
    description: "Delivery-focused with live tracking and quick checkout",
    layout: "delivery-first",
    colors: { bg: "#ecfdf5", primary: "#059669", secondary: "#d1fae5", accent: "#065f46", text: "#1f2937" },
    features: ["Live Tracking", "Quick Checkout", "Scheduled Orders", "Driver Tips"],
  },

  // ===== PIZZA THEMES (5 unique layouts) =====
  {
    id: "woodfire-italian",
    name: "Wood Fire Italian",
    category: "pizza",
    price: 59.99,
    description: "Authentic Italian pizzeria with rustic wood-fired look",
    layout: "italian-rustic",
    colors: { bg: "#1c1917", primary: "#dc2626", secondary: "#292524", accent: "#fef2f2", text: "#fafaf9" },
    features: ["Wood Fire Oven", "Italian Recipes", "Wine Pairing", "Dine-In Focus"],
  },
  {
    id: "slice-menu",
    name: "Slice & Dice",
    category: "pizza",
    price: 44.99,
    description: "Slice-by-slice menu with quick order by the slice",
    layout: "slice-grid",
    colors: { bg: "#fffbeb", primary: "#ea580c", secondary: "#fed7aa", accent: "#c2410c", text: "#1c1917" },
    features: ["By The Slice", "Build Your Own", "Slice Deals", "Late Night"],
  },
  {
    id: "pizza-delivery",
    name: "Pizza Express",
    category: "pizza",
    price: 54.99,
    description: "Delivery-optimized with pizza tracker and quick reorder",
    layout: "delivery-pizza",
    colors: { bg: "#18181b", primary: "#16a34a", secondary: "#27272a", accent: "#bbf7d0", text: "#fafafa" },
    features: ["Pizza Tracker", "Quick Reorder", "Group Orders", "Coupons"],
  },
  {
    id: "family-pizza",
    name: "Family Pizza Night",
    category: "pizza",
    price: 47.99,
    description: "Family-focused with deal bundles and party packages",
    layout: "family-deals",
    colors: { bg: "#fef2f2", primary: "#b91c1c", secondary: "#fee2e2", accent: "#fbbf24", text: "#1f2937" },
    features: ["Family Deals", "Party Packages", "Kids Menu", "Game Night Combos"],
  },
  {
    id: "modern-pizzeria",
    name: "Modern Pizzeria",
    category: "pizza",
    price: 64.99,
    description: "Contemporary artisan pizza with gourmet toppings",
    layout: "modern-artisan",
    colors: { bg: "#0f172a", primary: "#f97316", secondary: "#1e293b", accent: "#fed7aa", text: "#f1f5f9" },
    features: ["Artisan Toppings", "Craft Beer", "Seasonal Specials", "Chef Table"],
  },
]

// Structurally Different Mockup Component
function ThemeMockup({ theme }: { theme: typeof THEMES[0] }) {
  const { colors, layout } = theme
  
  switch(layout) {
    // LUXURY FULLSCREEN
    case "luxury-fullscreen":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="relative h-[55%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              <div className="text-[6px] uppercase tracking-[0.2em] mb-1" style={{ color: colors.primary }}>Fine Dining</div>
              <div className="text-[10px] font-serif" style={{ color: colors.text }}>RESTAURANT</div>
              <div className="mt-2 px-3 py-0.5 text-[5px]" style={{ background: colors.primary, color: colors.bg }}>Reserve Table</div>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-[1px]" style={{ background: colors.primary }} />
          </div>
          <div className="flex-1 p-2 grid grid-cols-3 gap-1">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-sm p-1 text-center" style={{ background: colors.secondary, border: `1px solid ${colors.primary}30` }}>
                <div className="w-full aspect-square rounded-sm mb-1" style={{ background: `${colors.primary}20` }} />
                <div className="text-[4px]" style={{ color: colors.text }}>Dish {i}</div>
                <div className="text-[5px]" style={{ color: colors.primary }}>$45</div>
              </div>
            ))}
          </div>
        </div>
      )

    // CARD GRID - Family restaurant
    case "card-grid":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[35%] flex">
            <div className="w-1/2 p-2 flex flex-col justify-center">
              <div className="text-[8px] font-bold" style={{ color: colors.accent }}>Family</div>
              <div className="text-[6px]" style={{ color: colors.text }}>RESTAURANT</div>
              <div className="mt-1 w-10 h-[2px] rounded" style={{ background: colors.primary }} />
            </div>
            <div className="w-1/2 p-1">
              <div className="w-full h-full rounded-lg" style={{ background: colors.primary }} />
            </div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-lg overflow-hidden shadow-sm" style={{ background: colors.secondary }}>
                <div className="h-8" style={{ background: `${colors.primary}40` }} />
                <div className="p-1">
                  <div className="text-[5px] font-bold" style={{ color: colors.text }}>Family Meal</div>
                  <div className="flex justify-between items-center mt-0.5">
                    <div className="text-[6px] font-bold" style={{ color: colors.primary }}>$29</div>
                    <div className="px-1 py-0.5 rounded text-[4px]" style={{ background: colors.primary, color: colors.bg }}>Add</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    // MENU BOARD - Modern bistro
    case "menu-board":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[30%] relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary})` }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] font-bold" style={{ color: colors.text }}>BISTRO</div>
                <div className="text-[5px]" style={{ color: colors.accent }}>Modern Kitchen</div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-2">
            <div className="grid grid-cols-4 gap-1 h-full">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded p-1 flex flex-col" style={{ background: colors.secondary }}>
                  <div className="flex-1 rounded mb-0.5" style={{ background: `${colors.primary}30` }} />
                  <div className="text-[4px]" style={{ color: colors.text }}>Item</div>
                  <div className="text-[5px] font-bold" style={{ color: colors.primary }}>$12</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    // BOOKING CENTRIC
    case "booking-centric":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[50%] p-3 flex flex-col items-center justify-center text-center">
            <div className="text-[8px] font-bold" style={{ color: colors.text }}>Reserve Your Table</div>
            <div className="mt-2 w-full max-w-[80%] p-2 rounded-lg" style={{ background: colors.secondary, border: `1px solid ${colors.primary}40` }}>
              <div className="grid grid-cols-2 gap-1 mb-1">
                <div className="h-3 rounded text-[4px] flex items-center justify-center" style={{ background: colors.bg, color: colors.text }}>Date</div>
                <div className="h-3 rounded text-[4px] flex items-center justify-center" style={{ background: colors.bg, color: colors.text }}>Time</div>
              </div>
              <div className="h-3 rounded text-[4px] flex items-center justify-center" style={{ background: colors.primary, color: colors.bg }}>Book Now</div>
            </div>
          </div>
          <div className="flex-1 p-2">
            <div className="space-y-1">
              {[1,2,3].map(i => (
                <div key={i} className="flex justify-between items-center p-1 rounded" style={{ background: colors.secondary }}>
                  <div className="text-[5px]" style={{ color: colors.text }}>Special Dish {i}</div>
                  <div className="text-[5px]" style={{ color: colors.primary }}>$35</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    // GALLERY FOCUS
    case "gallery-focus":
      return (
        <div className="h-full" style={{ background: colors.bg }}>
          <div className="h-[40%] p-1">
            <div className="h-full flex gap-1">
              <div className="w-2/3 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0" style={{ background: `${colors.primary}30` }} />
                <div className="absolute bottom-1 left-1 text-[6px] font-bold" style={{ color: colors.text }}>Featured</div>
              </div>
              <div className="w-1/3 flex flex-col gap-1">
                <div className="flex-1 rounded" style={{ background: `${colors.primary}20` }} />
                <div className="flex-1 rounded" style={{ background: `${colors.primary}20` }} />
              </div>
            </div>
          </div>
          <div className="h-[60%] p-2 grid grid-cols-3 gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded overflow-hidden relative" style={{ background: colors.secondary }}>
                <div className="absolute inset-0" style={{ background: `${colors.primary}20` }} />
                <div className="absolute bottom-0 inset-x-0 p-0.5 text-center" style={{ background: `${colors.bg}cc` }}>
                  <div className="text-[4px]" style={{ color: colors.text }}>Dish</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    // COZY RUSTIC - Coffee shop
    case "cozy-rustic":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[40%] flex">
            <div className="w-[45%] p-2 flex flex-col justify-center">
              <div className="text-[7px] font-serif" style={{ color: colors.accent }}>Coffee</div>
              <div className="text-[5px]" style={{ color: colors.text }}>House</div>
              <div className="mt-1 text-[4px]" style={{ color: `${colors.text}80` }}>Est. 2020</div>
            </div>
            <div className="flex-1 p-1">
              <div className="h-full rounded-2xl" style={{ background: colors.primary }} />
            </div>
          </div>
          <div className="flex-1 m-2 rounded-lg p-2" style={{ background: colors.secondary, border: `2px solid ${colors.primary}40` }}>
            <div className="text-[5px] text-center mb-1" style={{ color: colors.accent }}>- MENU -</div>
            <div className="space-y-0.5">
              {["Espresso", "Latte", "Cappuccino"].map((item, i) => (
                <div key={i} className="flex justify-between text-[4px]" style={{ color: colors.text }}>
                  <span>{item}</span>
                  <span style={{ color: colors.accent }}>${3 + i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    // PASTEL SWEET - Bakery
    case "pastel-sweet":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[35%] relative">
            <div className="absolute inset-x-0 top-0 h-full" style={{ background: colors.primary, borderRadius: "0 0 50% 50% / 0 0 30% 30%" }} />
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div>
                <div className="text-[8px] font-bold" style={{ color: colors.bg }}>Sweet</div>
                <div className="text-[5px]" style={{ color: `${colors.bg}cc` }}>Bakery & Cafe</div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl p-1.5 text-center" style={{ background: colors.secondary, boxShadow: `0 2px 8px ${colors.primary}20` }}>
                <div className="w-8 h-8 mx-auto rounded-full mb-1" style={{ background: `${colors.primary}30` }} />
                <div className="text-[4px] font-medium" style={{ color: colors.accent }}>Pastry</div>
                <div className="text-[5px] font-bold" style={{ color: colors.primary }}>$5</div>
              </div>
            ))}
          </div>
        </div>
      )

    // MINIMAL CLEAN
    case "minimal-clean":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[40%] flex items-center justify-center">
            <div className="text-center">
              <div className="text-[12px] font-light tracking-widest" style={{ color: colors.primary }}>CAFE</div>
              <div className="w-6 h-[1px] mx-auto my-1" style={{ background: colors.accent }} />
              <div className="text-[5px] tracking-wider" style={{ color: colors.accent }}>minimal & clean</div>
            </div>
          </div>
          <div className="flex-1 px-4">
            <div className="space-y-2">
              {["Coffee", "Tea", "Pastries"].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b" style={{ borderColor: `${colors.accent}30` }}>
                  <span className="text-[5px]" style={{ color: colors.primary }}>{item}</span>
                  <span className="text-[5px]" style={{ color: colors.accent }}>from ${2 + i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    // DARK MOODY - Espresso
    case "dark-moody":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[45%] relative">
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.bg})` }} />
            <div className="absolute inset-0 flex items-end justify-center pb-3">
              <div className="text-center">
                <div className="text-[9px] font-bold tracking-wider" style={{ color: colors.accent }}>ESPRESSO</div>
                <div className="text-[4px] uppercase tracking-widest" style={{ color: `${colors.accent}80` }}>Specialty Coffee</div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-1">
            {[1,2,3,4].map(i => (
              <div key={i} className="p-1.5 rounded" style={{ background: colors.secondary, border: `1px solid ${colors.primary}30` }}>
                <div className="text-[5px]" style={{ color: colors.text }}>Specialty</div>
                <div className="text-[4px]" style={{ color: colors.accent }}>Single Origin</div>
                <div className="text-[5px] font-bold mt-0.5" style={{ color: colors.primary }}>$6</div>
              </div>
            ))}
          </div>
        </div>
      )

    // BRUNCH BRIGHT
    case "brunch-bright":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[35%] p-2 flex items-center justify-between" style={{ background: colors.secondary }}>
            <div>
              <div className="text-[8px] font-bold" style={{ color: colors.primary }}>Brunch</div>
              <div className="text-[5px]" style={{ color: colors.accent }}>All Day Breakfast</div>
            </div>
            <div className="w-12 h-12 rounded-full" style={{ background: `${colors.primary}30` }} />
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-1">
            {["Eggs", "Pancakes", "Smoothie", "Toast"].map((item, i) => (
              <div key={i} className="rounded-lg p-1" style={{ background: colors.secondary }}>
                <div className="h-6 rounded mb-0.5" style={{ background: `${colors.primary}20` }} />
                <div className="text-[4px] font-medium" style={{ color: colors.accent }}>{item}</div>
                <div className="text-[5px] font-bold" style={{ color: colors.primary }}>${8 + i}</div>
              </div>
            ))}
          </div>
        </div>
      )

    // FAST ORDER - Chicken
    case "fast-order":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[30%] p-2 flex items-center justify-between" style={{ background: colors.secondary }}>
            <div>
              <div className="text-[9px] font-bold" style={{ color: colors.primary }}>QUICK</div>
              <div className="text-[6px] font-bold" style={{ color: colors.accent }}>ORDER</div>
            </div>
            <div className="px-2 py-1 rounded-full text-[5px]" style={{ background: colors.primary, color: colors.bg }}>Order Now</div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-1">
            {["Combo 1", "Combo 2", "Combo 3", "Combo 4"].map((item, i) => (
              <div key={i} className="rounded-lg overflow-hidden" style={{ background: "white" }}>
                <div className="h-8" style={{ background: `${colors.primary}20` }} />
                <div className="p-1">
                  <div className="text-[4px] font-bold" style={{ color: colors.text }}>{item}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[5px] font-bold" style={{ color: colors.primary }}>${7 + i}</span>
                    <div className="w-4 h-3 rounded text-[4px] flex items-center justify-center" style={{ background: colors.accent, color: colors.bg }}>+</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    // SPICY FIRE - Peri peri
    case "spicy-fire":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[40%] relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${colors.bg}, ${colors.primary}60)` }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] font-black" style={{ color: colors.text }}>PERI PERI</div>
                <div className="flex justify-center gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-2 space-y-1">
            {["Mild", "Hot", "Extra Hot"].map((level, i) => (
              <div key={i} className="flex items-center justify-between p-1.5 rounded" style={{ background: colors.secondary }}>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ background: `${colors.primary}${30 + i * 20}` }} />
                  <span className="text-[5px]" style={{ color: colors.text }}>{level} Chicken</span>
                </div>
                <span className="text-[5px] font-bold" style={{ color: colors.accent }}>${10 + i * 2}</span>
              </div>
            ))}
          </div>
        </div>
      )

    // DEALS FOCUS - Fried chicken
    case "deals-focus":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[35%] m-1 rounded-lg p-2 flex items-center justify-between" style={{ background: colors.primary }}>
            <div>
              <div className="text-[10px] font-black" style={{ color: colors.bg }}>50% OFF</div>
              <div className="text-[5px]" style={{ color: `${colors.bg}cc` }}>Family Bucket</div>
            </div>
            <div className="w-10 h-10 rounded-full" style={{ background: `${colors.bg}30` }} />
          </div>
          <div className="flex-1 p-2 grid grid-cols-3 gap-1">
            {[6, 12, 20].map((pcs, i) => (
              <div key={i} className="rounded-lg p-1 text-center" style={{ background: colors.secondary }}>
                <div className="w-6 h-6 mx-auto rounded-full mb-0.5" style={{ background: `${colors.primary}30` }} />
                <div className="text-[5px] font-bold" style={{ color: colors.accent }}>{pcs} Pcs</div>
                <div className="text-[6px] font-bold" style={{ color: colors.primary }}>${10 + i * 8}</div>
              </div>
            ))}
          </div>
        </div>
      )

    // COMBO GRID
    case "combo-grid":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[30%] p-2 flex items-center" style={{ background: colors.secondary }}>
            <div className="flex-1">
              <div className="text-[8px] font-bold" style={{ color: colors.primary }}>BUILD YOUR</div>
              <div className="text-[6px] font-bold" style={{ color: colors.text }}>COMBO</div>
            </div>
            <div className="w-12 h-10 rounded" style={{ background: `${colors.primary}30` }} />
          </div>
          <div className="flex-1 p-1.5">
            <div className="grid grid-cols-4 gap-1 h-full">
              {["Main", "Side", "Drink", "Sauce", "Main", "Side", "Drink", "Extra"].map((type, i) => (
                <div key={i} className="rounded p-0.5 flex flex-col items-center justify-center" style={{ background: colors.secondary }}>
                  <div className="w-4 h-4 rounded mb-0.5" style={{ background: `${colors.primary}40` }} />
                  <div className="text-[3px]" style={{ color: colors.text }}>{type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    // DELIVERY FIRST
    case "delivery-first":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[40%] p-2">
            <div className="h-full rounded-lg p-2 flex flex-col justify-between" style={{ background: colors.primary }}>
              <div className="text-[8px] font-bold" style={{ color: colors.bg }}>FREE DELIVERY</div>
              <div className="flex items-center gap-1">
                <div className="text-[5px]" style={{ color: `${colors.bg}cc` }}>Order in</div>
                <div className="px-1 py-0.5 rounded text-[6px] font-bold" style={{ background: colors.bg, color: colors.primary }}>30 min</div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-1">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-lg p-1 flex items-center gap-1" style={{ background: colors.secondary }}>
                <div className="w-6 h-6 rounded" style={{ background: `${colors.primary}20` }} />
                <div className="flex-1">
                  <div className="text-[4px]" style={{ color: colors.text }}>Chicken</div>
                  <div className="text-[5px] font-bold" style={{ color: colors.primary }}>${12}</div>
                </div>
                <div className="w-4 h-4 rounded flex items-center justify-center text-[6px]" style={{ background: colors.primary, color: colors.bg }}>+</div>
              </div>
            ))}
          </div>
        </div>
      )

    // ITALIAN RUSTIC - Pizza
    case "italian-rustic":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[40%] relative">
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.bg})` }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] font-serif italic" style={{ color: colors.accent }}>Pizzeria</div>
                <div className="text-[5px] uppercase tracking-widest" style={{ color: colors.primary }}>Wood Fired</div>
                <div className="w-8 h-[1px] mx-auto mt-1" style={{ background: colors.primary }} />
              </div>
            </div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-1">
            {["Margherita", "Pepperoni", "Quattro", "Diavola"].map((pizza, i) => (
              <div key={i} className="rounded p-1" style={{ background: colors.secondary, border: `1px solid ${colors.primary}30` }}>
                <div className="w-full aspect-square rounded mb-0.5" style={{ background: `${colors.primary}20` }} />
                <div className="text-[4px] font-serif" style={{ color: colors.text }}>{pizza}</div>
                <div className="text-[5px] font-bold" style={{ color: colors.primary }}>${12 + i * 2}</div>
              </div>
            ))}
          </div>
        </div>
      )

    // SLICE GRID
    case "slice-grid":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[30%] p-2 flex items-center justify-between" style={{ background: colors.secondary }}>
            <div>
              <div className="text-[9px] font-bold" style={{ color: colors.primary }}>SLICE</div>
              <div className="text-[5px]" style={{ color: colors.accent }}>By The Piece</div>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.primary}20` }}>
              <div className="text-[8px]" style={{ color: colors.primary }}>$3</div>
            </div>
          </div>
          <div className="flex-1 p-1.5 grid grid-cols-3 gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded overflow-hidden" style={{ background: "white" }}>
                <div className="aspect-square" style={{ background: `${colors.primary}30` }} />
                <div className="p-0.5 text-center">
                  <div className="text-[4px]" style={{ color: colors.text }}>Slice</div>
                  <div className="text-[5px] font-bold" style={{ color: colors.primary }}>${3}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    // DELIVERY PIZZA
    case "delivery-pizza":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[35%] p-2">
            <div className="h-full rounded-lg p-2" style={{ background: colors.secondary }}>
              <div className="text-[6px] mb-1" style={{ color: colors.text }}>Track Your Pizza</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((_, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${i < 2 ? '' : 'opacity-30'}`} style={{ background: colors.primary }} />
                ))}
              </div>
              <div className="text-[5px] mt-1" style={{ color: colors.accent }}>Preparing your order...</div>
            </div>
          </div>
          <div className="flex-1 p-2 space-y-1">
            {["Large Pizza", "Medium Pizza", "Sides"].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-1.5 rounded" style={{ background: colors.secondary }}>
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded" style={{ background: `${colors.primary}30` }} />
                  <span className="text-[5px]" style={{ color: colors.text }}>{item}</span>
                </div>
                <div className="px-1.5 py-0.5 rounded text-[4px]" style={{ background: colors.primary, color: colors.bg }}>Add</div>
              </div>
            ))}
          </div>
        </div>
      )

    // FAMILY DEALS - Pizza
    case "family-deals":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[35%] m-1 rounded-xl p-2" style={{ background: colors.primary }}>
            <div className="text-[9px] font-bold" style={{ color: colors.bg }}>FAMILY</div>
            <div className="text-[6px]" style={{ color: `${colors.bg}cc` }}>Pizza Night Deal</div>
            <div className="mt-2 inline-block px-2 py-0.5 rounded text-[5px]" style={{ background: colors.accent, color: colors.bg }}>$39.99</div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-1">
            {["2 Large", "4 Sides", "2L Drink", "Dessert"].map((item, i) => (
              <div key={i} className="rounded-lg p-1.5 text-center" style={{ background: colors.secondary }}>
                <div className="text-[5px] font-bold" style={{ color: colors.primary }}>{item}</div>
                <div className="text-[4px]" style={{ color: colors.text }}>Included</div>
              </div>
            ))}
          </div>
        </div>
      )

    // MODERN ARTISAN - Pizza
    case "modern-artisan":
      return (
        <div className="h-full flex flex-col" style={{ background: colors.bg }}>
          <div className="h-[45%] relative">
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary})` }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] font-bold tracking-wider" style={{ color: colors.text }}>ARTISAN</div>
                <div className="text-[5px] tracking-widest" style={{ color: colors.accent }}>PIZZA & CRAFT BEER</div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-1">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded overflow-hidden" style={{ background: colors.secondary }}>
                <div className="h-8" style={{ background: `${colors.primary}30` }} />
                <div className="p-1">
                  <div className="text-[4px]" style={{ color: colors.text }}>Artisan</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[5px] font-bold" style={{ color: colors.primary }}>${16 + i * 2}</span>
                    <div className="w-3 h-3 rounded-full flex items-center justify-center text-[5px]" style={{ background: `${colors.accent}30`, color: colors.accent }}>+</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return (
        <div className="h-full flex items-center justify-center" style={{ background: colors.bg }}>
          <div className="text-[8px]" style={{ color: colors.text }}>Theme Preview</div>
        </div>
      )
  }
}

// Theme Card Component
function ThemeCard({ theme }: { theme: typeof THEMES[0] }) {
  const categoryColors: Record<string, string> = {
    restaurant: "from-amber-500 to-orange-600",
    cafe: "from-amber-600 to-yellow-700",
    chicken: "from-red-500 to-orange-500",
    pizza: "from-red-600 to-rose-600",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-xl overflow-hidden glass border border-white/10 hover:border-white/20 transition-all duration-300"
    >
      {/* Theme Mockup Preview */}
      <div className="relative h-52 overflow-hidden">
        <ThemeMockup theme={theme} />
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
        
        {/* Price Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-sm text-white border border-white/20">
          ${theme.price}
        </div>
        
        {/* Category Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-medium text-white bg-gradient-to-r ${categoryColors[theme.category]}`}>
          {theme.category.charAt(0).toUpperCase() + theme.category.slice(1)}
        </div>
        
        {/* Hover Actions */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Button size="sm" variant="secondary" className="gap-1.5 shadow-lg" asChild>
            <Link href={`/themes/${theme.id}`}>
              <Eye className="w-3.5 h-3.5" />
              Preview
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5 bg-gradient-to-r from-primary to-accent shadow-lg" asChild>
            <Link href={`/themes/${theme.id}`}>
              <ShoppingBag className="w-3.5 h-3.5" />
              Select Theme
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Theme Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">{theme.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{theme.description}</p>
        
        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {theme.features.slice(0, 3).map((feature, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function ThemesPage() {
  const [category, setCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const THEMES_PER_PAGE = 12

  // Filter themes
  const filteredThemes = useMemo(() => {
    return THEMES.filter(theme => {
      const matchesCategory = category === "all" || theme.category === category
      const matchesSearch = search === "" || 
        theme.name.toLowerCase().includes(search.toLowerCase()) ||
        theme.description.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [category, search])

  // Paginate
  const totalPages = Math.ceil(filteredThemes.length / THEMES_PER_PAGE)
  const paginatedThemes = filteredThemes.slice(
    (page - 1) * THEMES_PER_PAGE,
    page * THEMES_PER_PAGE
  )

  // Reset page when filters change
  const handleCategoryChange = (value: string) => {
    setCategory(value)
    setPage(1)
  }

  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* Same SpaceBackground as Homepage */}
      <SpaceBackground />
      
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-32 pb-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full glass border border-white/10 px-5 py-2.5"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground/80">
                {THEMES.length} Premium Themes Available
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              <span className="text-foreground">Choose Your Perfect</span>
              <br />
              <span className="gradient-text">Website Theme</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Professional, mobile-optimized themes designed for restaurants, cafes, 
              chicken shops, and pizzerias. Each theme is structurally unique.
            </motion.p>
          </div>
        </section>

        {/* Filters */}
        <section className="px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 items-center justify-between glass rounded-xl p-4 border border-white/10"
            >
              {/* Category Filter */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-white/5 border-white/10">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Search */}
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search themes..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
              
              {/* Results Count */}
              <div className="text-sm text-muted-foreground">
                {filteredThemes.length} theme{filteredThemes.length !== 1 ? 's' : ''} found
              </div>
            </motion.div>
          </div>
        </section>

        {/* Themes Grid */}
        <section className="px-4 pb-16">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${category}-${search}-${page}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {paginatedThemes.map((theme, index) => (
                  <motion.div
                    key={theme.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ThemeCard theme={theme} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
            
            {/* Empty State */}
            {paginatedThemes.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">
                  <Search className="w-16 h-16 mx-auto text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No themes found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-4 mt-12"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                        page === i + 1
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </section>
        
        <Footer />
      </div>
    </main>
  )
}
