"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Building2,
  Palette,
  Puzzle,
  Globe,
  CreditCard,
  Rocket,
  CheckCircle2,
  Upload,
  Sun,
  Moon,
  Truck,
  ShoppingBag,
  Calendar,
  ChefHat,
  MessageSquare,
  QrCode,
  Printer,
  Heart,
  MapPin,
  Check,
  Loader2,
  Star,
  Clock,
  Image as ImageIcon,
  Bell,
  Receipt,
  Banknote,
  Smartphone,
  CreditCard as CreditCardIcon,
  ExternalLink,
  Copy,
  Eye,
  Sparkles,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

interface WebsiteLaunchWizardProps {
  theme: {
    id: string
    name: string
    category: string
    price: number
    description: string
    features: string[]
    colors?: {
      primary: string
      secondary: string
      accent: string
    }
  }
  onClose: () => void
}

// Module definitions with pricing
const MODULES = [
  { id: "online_ordering", name: "Online Ordering", description: "Accept orders directly from your website", price: 0, icon: ShoppingBag, included: true },
  { id: "driver_system", name: "Delivery Driver System", description: "Real-time driver tracking & assignments", price: 9.99, icon: Truck },
  { id: "kitchen_display", name: "Kitchen Display System", description: "Live order management for kitchen staff", price: 7.99, icon: ChefHat },
  { id: "whatsapp_ordering", name: "WhatsApp Ordering", description: "Accept orders via WhatsApp chat", price: 5.99, icon: MessageSquare },
  { id: "booking_system", name: "Booking System", description: "Table reservations & appointments", price: 8.99, icon: Calendar },
  { id: "loyalty_rewards", name: "Loyalty Rewards", description: "Points & rewards for returning customers", price: 6.99, icon: Heart },
  { id: "reviews_section", name: "Reviews Section", description: "Customer reviews & ratings display", price: 0, icon: Star, included: true },
  { id: "gallery", name: "Photo Gallery", description: "Showcase your food & venue photos", price: 0, icon: ImageIcon, included: true },
  { id: "qr_menu", name: "QR Menu", description: "Contactless menu scanning", price: 4.99, icon: QrCode },
  { id: "push_notifications", name: "Push Notifications", description: "Send updates to customers", price: 3.99, icon: Bell },
  { id: "invoice_system", name: "Invoice System", description: "Generate professional invoices", price: 4.99, icon: Receipt },
  { id: "receipt_printing", name: "Receipt Printing", description: "Thermal printer integration", price: 5.99, icon: Printer },
]

// Payment method options
const PAYMENT_METHODS = [
  { id: "cash", name: "Cash Payment", icon: Banknote, price: 0 },
  { id: "card", name: "Card Payment", icon: CreditCardIcon, price: 0 },
  { id: "apple_pay", name: "Apple Pay", icon: Smartphone, price: 2.99 },
  { id: "google_pay", name: "Google Pay", icon: Smartphone, price: 2.99 },
]

const COUNTRIES = [
  "United Kingdom", "United States", "Canada", "Australia", "Germany", "France", 
  "Spain", "Italy", "Netherlands", "Belgium", "Ireland", "Pakistan", "India", 
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman"
]

const CURRENCIES: Record<string, { code: string; symbol: string; name: string }> = {
  "United Kingdom": { code: "GBP", symbol: "£", name: "British Pound" },
  "United States": { code: "USD", symbol: "$", name: "US Dollar" },
  "Canada": { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  "Australia": { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  "Germany": { code: "EUR", symbol: "€", name: "Euro" },
  "France": { code: "EUR", symbol: "€", name: "Euro" },
  "Spain": { code: "EUR", symbol: "€", name: "Euro" },
  "Italy": { code: "EUR", symbol: "€", name: "Euro" },
  "Netherlands": { code: "EUR", symbol: "€", name: "Euro" },
  "Belgium": { code: "EUR", symbol: "€", name: "Euro" },
  "Ireland": { code: "EUR", symbol: "€", name: "Euro" },
  "Pakistan": { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  "India": { code: "INR", symbol: "₹", name: "Indian Rupee" },
  "United Arab Emirates": { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  "Saudi Arabia": { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  "Qatar": { code: "QAR", symbol: "﷼", name: "Qatari Riyal" },
  "Kuwait": { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  "Bahrain": { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar" },
  "Oman": { code: "OMR", symbol: "﷼", name: "Omani Rial" },
}

const FONTS = [
  { id: "inter", name: "Inter", sample: "Modern & Clean" },
  { id: "poppins", name: "Poppins", sample: "Friendly & Rounded" },
  { id: "playfair", name: "Playfair Display", sample: "Elegant & Classic" },
  { id: "montserrat", name: "Montserrat", sample: "Bold & Professional" },
  { id: "lato", name: "Lato", sample: "Warm & Inviting" },
]

const COLOR_SCHEMES = [
  { id: "classic", name: "Classic", primary: "#1a1a2e", secondary: "#d4af37", accent: "#f5f5dc" },
  { id: "modern", name: "Modern Dark", primary: "#0f0f0f", secondary: "#ff6b35", accent: "#ffffff" },
  { id: "warm", name: "Warm Rustic", primary: "#8B4513", secondary: "#DEB887", accent: "#F5DEB3" },
  { id: "fresh", name: "Fresh Green", primary: "#2E7D32", secondary: "#FFC107", accent: "#FFEB3B" },
  { id: "elegant", name: "Elegant Blue", primary: "#1a365d", secondary: "#3182ce", accent: "#e2e8f0" },
  { id: "minimal", name: "Minimal Light", primary: "#ffffff", secondary: "#000000", accent: "#f5f5f5" },
]

const LAYOUTS = [
  { id: "classic", name: "Classic", description: "Traditional navigation with sidebar" },
  { id: "modern", name: "Modern", description: "Full-width hero with sticky nav" },
  { id: "minimal", name: "Minimal", description: "Clean & distraction-free" },
]

const STEPS = [
  { id: 1, title: "Business Info", icon: Building2 },
  { id: 2, title: "Theme Options", icon: Palette },
  { id: 3, title: "Features", icon: Puzzle },
  { id: 4, title: "Domain", icon: Globe },
  { id: 5, title: "Payment", icon: CreditCard },
  { id: 6, title: "Creating", icon: Rocket },
  { id: 7, title: "Google Business", icon: MapPin },
  { id: 8, title: "Success", icon: CheckCircle2 },
]

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function WebsiteLaunchWizard({ theme, onClose }: WebsiteLaunchWizardProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [creationProgress, setCreationProgress] = useState(0)
  const [creationStatus, setCreationStatus] = useState("")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  
  // Step 1 - Business Info
  const [businessInfo, setBusinessInfo] = useState({
    businessName: "",
    category: theme.category || "restaurant",
    phone: "",
    whatsapp: "",
    email: user?.email || "",
    address: "",
    country: "United Kingdom",
    description: "",
    logoFile: null as File | null,
    logoPreview: "",
  })
  
  // Opening Hours
  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { open: "09:00", close: "22:00", closed: day === "Sunday" }
    }), {})
  )
  
  // Step 2 - Theme Options
  const [themeOptions, setThemeOptions] = useState({
    colorScheme: "classic",
    customColors: theme.colors || { primary: "#1a1a2e", secondary: "#d4af37", accent: "#f5f5dc" },
    font: "inter",
    layout: "modern",
    darkMode: true,
  })
  
  // Step 3 - Features & Modules
  const [selectedModules, setSelectedModules] = useState<string[]>(["online_ordering", "reviews_section", "gallery"])
  const [selectedPayments, setSelectedPayments] = useState<string[]>(["cash", "card"])
  
  // Step 4 - Domain
  const [domainOption, setDomainOption] = useState<"subdomain" | "custom" | "later">("subdomain")
  const [subdomain, setSubdomain] = useState("")
  const [customDomain, setCustomDomain] = useState("")
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  
  // Step 7 - Google Business
  const [googleBusiness, setGoogleBusiness] = useState({
    wantSetup: true,
    assistedSetup: false,
    existingProfileUrl: "",
    showMapImmediately: true,
  })
  
  // Results after creation
  const [createdSite, setCreatedSite] = useState<{
    id: string
    subdomain: string
    liveUrl: string
    dashboardUrl: string
    adminLogin: { email: string; tempPassword: string }
    managerLogin?: { pin: string }
  } | null>(null)

  // Calculate pricing
  const getModulePrice = useCallback((moduleId: string) => {
    const module = MODULES.find(m => m.id === moduleId)
    if (!module || module.included) return 0
    return billingCycle === "yearly" ? module.price * 10 : module.price
  }, [billingCycle])

  const getPaymentMethodPrice = useCallback((paymentId: string) => {
    const payment = PAYMENT_METHODS.find(p => p.id === paymentId)
    if (!payment) return 0
    return billingCycle === "yearly" ? payment.price * 10 : payment.price
  }, [billingCycle])

  const totalModulesPrice = selectedModules.reduce((sum, id) => sum + getModulePrice(id), 0)
  const totalPaymentsPrice = selectedPayments.reduce((sum, id) => sum + getPaymentMethodPrice(id), 0)
  const totalMonthlyPrice = totalModulesPrice + totalPaymentsPrice
  const themePrice = theme.price
  const grandTotal = themePrice + (billingCycle === "yearly" ? totalMonthlyPrice : totalMonthlyPrice)

  const currency = CURRENCIES[businessInfo.country] || CURRENCIES["United Kingdom"]

  // Check subdomain availability
  const checkSubdomainAvailability = useCallback(async () => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null)
      return
    }
    setCheckingSubdomain(true)
    try {
      const res = await fetch(`/api/customer/check-subdomain?subdomain=${subdomain}`)
      const data = await res.json()
      setSubdomainAvailable(data.available)
    } catch {
      setSubdomainAvailable(null)
    } finally {
      setCheckingSubdomain(false)
    }
  }, [subdomain])

  useEffect(() => {
    const timer = setTimeout(checkSubdomainAvailability, 500)
    return () => clearTimeout(timer)
  }, [subdomain, checkSubdomainAvailability])

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBusinessInfo(prev => ({ ...prev, logoFile: file }))
      const reader = new FileReader()
      reader.onload = (ev) => {
        setBusinessInfo(prev => ({ ...prev, logoPreview: ev.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!businessInfo.businessName.trim()) {
          toast.error("Please enter your business name")
          return false
        }
        if (!businessInfo.phone.trim()) {
          toast.error("Please enter your phone number")
          return false
        }
        if (!businessInfo.address.trim()) {
          toast.error("Please enter your business address")
          return false
        }
        return true
      case 2:
        return true
      case 3:
        if (selectedPayments.length === 0) {
          toast.error("Please select at least one payment method")
          return false
        }
        return true
      case 4:
        if (domainOption === "subdomain" && !subdomain.trim()) {
          toast.error("Please enter a subdomain")
          return false
        }
        if (domainOption === "subdomain" && subdomainAvailable === false) {
          toast.error("This subdomain is not available")
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Process payment and create site
const processPayment = async () => {
  if (isProcessing) return

  setIsProcessing(true)
    setCurrentStep(6) // Move to creating step
    
    try {
      // Simulate creation progress
      const progressSteps = [
        { progress: 10, status: "Initializing your website..." },
        { progress: 25, status: "Setting up your theme..." },
        { progress: 40, status: "Configuring business settings..." },
        { progress: 55, status: "Enabling selected modules..." },
        { progress: 70, status: "Creating your dashboard..." },
        { progress: 85, status: "Generating access credentials..." },
        { progress: 95, status: "Finalizing setup..." },
        { progress: 100, status: "Website created successfully!" },
      ]

      // Create Stripe checkout session
      const checkoutRes = await fetch("/api/themes/launch-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: theme.id,
          themeName: theme.name,
          themePrice: themePrice * 100, // Convert to cents
          businessInfo,
          openingHours,
          themeOptions,
          selectedModules,
          selectedPayments,
          domainOption,
          subdomain: subdomain.toLowerCase(),
          customDomain,
          googleBusiness,
          billingCycle,
          modulesPrice: totalModulesPrice * 100,
          currency: currency.code,
        }),
      })

      if (!checkoutRes.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url, siteId } = await checkoutRes.json()

      // If there's a Stripe URL, redirect to payment
      if (url) {
        window.location.href = url
        return
      }

      // If no payment needed (free), proceed with creation
      for (const step of progressSteps) {
        setCreationProgress(step.progress)
        setCreationStatus(step.status)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Fetch created site details
      const siteRes = await fetch(`/api/customer/sites/${siteId}`)
      await siteRes.json()
      
      setCreatedSite({
        id: siteId,
        subdomain: subdomain.toLowerCase(),
        liveUrl: `https://${subdomain.toLowerCase()}.mujeebproai.com`,
        dashboardUrl: `/dashboard/sites/${siteId}`,
        adminLogin: {
          email: businessInfo.email || user?.email || "",
          tempPassword: "Check your email for login details",
        },
      })

      setCurrentStep(7) // Move to Google Business step
    } catch (error) {
      console.error("Error:", error)
      toast.error("Something went wrong. Please try again.")
      setCurrentStep(5) // Go back to payment step
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Tell Us About Your Business</h2>
              <p className="text-muted-foreground">This information will be displayed on your website</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Al Baik Restaurant"
                  value={businessInfo.businessName}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessName: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Business Category</Label>
                <select
                  id="category"
                  value={businessInfo.category}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-10 rounded-md border border-white/10 bg-[#0b0b10] px-3 text-sm text-white"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="chicken">Chicken Shop</option>
                  <option value="pizza">Pizza Shop</option>
                  <option value="bakery">Bakery</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+44 123 456 7890"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+44 123 456 7890"
                  value={businessInfo.whatsapp}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@yourbusiness.com"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <select
                  id="country"
                  value={businessInfo.country}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm"
                >
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Business Address *</Label>
                <Textarea
                  id="address"
                  placeholder="123 Main Street, City, Postcode"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-white/5 border-white/10 min-h-[80px]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell customers about your business, specialties, and what makes you unique..."
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/5 border-white/10 min-h-[100px]"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2 md:col-span-2">
                <Label>Business Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/5">
                    {businessInfo.logoPreview ? (
                      <img src={businessInfo.logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      className="border-white/20"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <Label className="text-base">Opening Hours</Label>
              <div className="space-y-3">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-28 text-sm">{day}</div>
                    <Switch
                      checked={!openingHours[day].closed}
                      onCheckedChange={(checked) => setOpeningHours(prev => ({
                        ...prev,
                        [day]: { ...prev[day], closed: !checked }
                      }))}
                    />
                    {!openingHours[day].closed ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={openingHours[day].open}
                          onChange={(e) => setOpeningHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day], open: e.target.value }
                          }))}
                          className="w-32 bg-white/5 border-white/10"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={openingHours[day].close}
                          onChange={(e) => setOpeningHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day], close: e.target.value }
                          }))}
                          className="w-32 bg-white/5 border-white/10"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Customize Your Theme</h2>
              <p className="text-muted-foreground">Choose colors, fonts, and layout for your website</p>
            </div>

            {/* Theme Preview */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-gradient-to-b from-white/5 to-transparent">
              <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center text-sm text-muted-foreground">
                  {subdomain || "your-business"}.mujeebproai.com
                </div>
              </div>
              <div 
                className="h-64 p-6 transition-all duration-300"
                style={{ 
                  backgroundColor: themeOptions.darkMode ? themeOptions.customColors.primary : "#ffffff",
                  color: themeOptions.darkMode ? "#ffffff" : themeOptions.customColors.primary
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="font-bold text-lg" style={{ fontFamily: themeOptions.font }}>
                    {businessInfo.businessName || "Your Business"}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>Home</span>
                    <span>Menu</span>
                    <span>About</span>
                    <span style={{ color: themeOptions.customColors.secondary }}>Order Now</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 
                    className="text-3xl font-bold"
                    style={{ fontFamily: themeOptions.font }}
                  >
                    Welcome to {businessInfo.businessName || "Your Restaurant"}
                  </h1>
                  <p className="opacity-70">Delicious food, delivered to your door</p>
                  <Button 
                    size="sm"
                    style={{ 
                      backgroundColor: themeOptions.customColors.secondary,
                      color: themeOptions.darkMode ? themeOptions.customColors.primary : "#ffffff"
                    }}
                  >
                    View Menu
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Color Scheme */}
              <div className="space-y-4">
                <Label className="text-base">Color Scheme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {COLOR_SCHEMES.map(scheme => (
                    <button
                      key={scheme.id}
                      onClick={() => setThemeOptions(prev => ({ 
                        ...prev, 
                        colorScheme: scheme.id,
                        customColors: { primary: scheme.primary, secondary: scheme.secondary, accent: scheme.accent }
                      }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        themeOptions.colorScheme === scheme.id 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: scheme.primary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: scheme.secondary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: scheme.accent }} />
                      </div>
                      <div className="text-xs">{scheme.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Selection */}
              <div className="space-y-4">
                <Label className="text-base">Font Style</Label>
                <div className="space-y-2">
                  {FONTS.map(font => (
                    <button
                      key={font.id}
                      onClick={() => setThemeOptions(prev => ({ ...prev, font: font.id }))}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        themeOptions.font === font.id 
                          ? "border-primary bg-primary/10" 
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="font-medium" style={{ fontFamily: font.id }}>{font.name}</div>
                      <div className="text-sm text-muted-foreground">{font.sample}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Selection */}
              <div className="space-y-4">
                <Label className="text-base">Layout Style</Label>
                <RadioGroup value={themeOptions.layout} onValueChange={(v) => setThemeOptions(prev => ({ ...prev, layout: v }))}>
                  {LAYOUTS.map(layout => (
                    <div key={layout.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={layout.id} id={`layout-${layout.id}`} />
                      <Label htmlFor={`layout-${layout.id}`} className="cursor-pointer">
                        <div className="font-medium">{layout.name}</div>
                        <div className="text-xs text-muted-foreground">{layout.description}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Dark/Light Mode */}
              <div className="space-y-4">
                <Label className="text-base">Appearance Mode</Label>
                <div className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/5">
                  <Sun className={`w-5 h-5 ${!themeOptions.darkMode ? "text-yellow-400" : "text-muted-foreground"}`} />
                  <Switch
                    checked={themeOptions.darkMode}
                    onCheckedChange={(checked) => setThemeOptions(prev => ({ ...prev, darkMode: checked }))}
                  />
                  <Moon className={`w-5 h-5 ${themeOptions.darkMode ? "text-blue-400" : "text-muted-foreground"}`} />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {themeOptions.darkMode ? "Dark Mode" : "Light Mode"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Select Features & Modules</h2>
              <p className="text-muted-foreground">Choose the features you need for your business</p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <span className={billingCycle === "monthly" ? "text-white" : "text-muted-foreground"}>Monthly</span>
              <Switch
                checked={billingCycle === "yearly"}
                onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
              />
              <span className={billingCycle === "yearly" ? "text-white" : "text-muted-foreground"}>
                Yearly <span className="text-green-400 text-sm">(Save 17%)</span>
              </span>
            </div>

            {/* Modules */}
            <div className="space-y-4">
              <Label className="text-base">Website Features</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {MODULES.map(module => {
                  const isSelected = selectedModules.includes(module.id)
                  const ModuleIcon = module.icon
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        if (module.included) return
                        setSelectedModules(prev => 
                          isSelected ? prev.filter(id => id !== module.id) : [...prev, module.id]
                        )
                      }}
                      disabled={module.included}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-white/10 hover:border-white/20"
                      } ${module.included ? "opacity-70" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/20" : "bg-white/10"}`}>
                            <ModuleIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {module.name}
                              {module.included && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Included</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{module.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {module.included ? (
                            <span className="text-green-400 font-medium">Free</span>
                          ) : (
                            <span className="font-medium">
                              {currency.symbol}{billingCycle === "yearly" ? (module.price * 10).toFixed(0) : module.price.toFixed(2)}
                              <span className="text-xs text-muted-foreground">/{billingCycle === "yearly" ? "yr" : "mo"}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <Label className="text-base">Payment Methods</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {PAYMENT_METHODS.map(method => {
                  const isSelected = selectedPayments.includes(method.id)
                  const MethodIcon = method.icon
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedPayments(prev => 
                          isSelected ? prev.filter(id => id !== method.id) : [...prev, method.id]
                        )
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MethodIcon className="w-5 h-5" />
                          <span className="font-medium">{method.name}</span>
                        </div>
                        {method.price > 0 ? (
                          <span className="font-medium">
                            {currency.symbol}{billingCycle === "yearly" ? (method.price * 10).toFixed(0) : method.price.toFixed(2)}
                            <span className="text-xs text-muted-foreground">/{billingCycle === "yearly" ? "yr" : "mo"}</span>
                          </span>
                        ) : (
                          <span className="text-green-400 font-medium">Free</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Live Pricing Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Theme (one-time)</span>
                <span className="font-medium">{currency.symbol}{themePrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">
                  Monthly modules {billingCycle === "yearly" && "(×12)"}
                </span>
                <span className="font-medium">{currency.symbol}{totalMonthlyPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="font-bold">Total Today</span>
                <span className="font-bold text-lg text-primary">{currency.symbol}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Your Domain</h2>
              <p className="text-muted-foreground">Select how customers will find your website</p>
            </div>

            <RadioGroup value={domainOption} onValueChange={(v: "subdomain" | "custom" | "later") => setDomainOption(v)}>
              {/* Free Subdomain */}
              <div className={`p-6 rounded-xl border-2 transition-all ${
                domainOption === "subdomain" ? "border-primary bg-primary/10" : "border-white/10"
              }`}>
                <div className="flex items-start gap-4">
                  <RadioGroupItem value="subdomain" id="subdomain" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="subdomain" className="cursor-pointer">
                      <div className="font-bold text-lg flex items-center gap-2">
                        Free Subdomain
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Recommended</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get a free subdomain like yourbusiness.mujeebproai.com
                      </p>
                    </Label>
                    {domainOption === "subdomain" && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="yourbusiness"
                            value={subdomain}
                            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            className="bg-white/5 border-white/10 flex-1"
                          />
                          <span className="text-muted-foreground">.mujeebproai.com</span>
                        </div>
                        {subdomain && (
                          <div className="flex items-center gap-2 text-sm">
                            {checkingSubdomain ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-muted-foreground">Checking availability...</span>
                              </>
                            ) : subdomainAvailable === true ? (
                              <>
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-green-400">{subdomain}.mujeebproai.com is available!</span>
                              </>
                            ) : subdomainAvailable === false ? (
                              <>
                                <X className="w-4 h-4 text-red-400" />
                                <span className="text-red-400">This subdomain is already taken</span>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Domain */}
              <div className={`p-6 rounded-xl border-2 transition-all ${
                domainOption === "custom" ? "border-primary bg-primary/10" : "border-white/10"
              }`}>
                <div className="flex items-start gap-4">
                  <RadioGroupItem value="custom" id="custom" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="custom" className="cursor-pointer">
                      <div className="font-bold text-lg">Connect Your Own Domain</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use a domain you already own (e.g., www.yourbusiness.com)
                      </p>
                    </Label>
                    {domainOption === "custom" && (
                      <div className="mt-4">
                        <Input
                          placeholder="www.yourbusiness.com"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                          className="bg-white/5 border-white/10"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          You&apos;ll need to update your DNS settings after setup
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buy Later */}
              <div className={`p-6 rounded-xl border-2 transition-all ${
                domainOption === "later" ? "border-primary bg-primary/10" : "border-white/10"
              }`}>
                <div className="flex items-start gap-4">
                  <RadioGroupItem value="later" id="later" className="mt-1" />
                  <Label htmlFor="later" className="cursor-pointer flex-1">
                    <div className="font-bold text-lg">Decide Later</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start with a free subdomain and add a custom domain anytime
                    </p>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {domainOption === "later" && (
              <div className="mt-4 space-y-2">
                <Label>Temporary Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="yourbusiness"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="bg-white/5 border-white/10 flex-1"
                  />
                  <span className="text-muted-foreground">.mujeebproai.com</span>
                </div>
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Complete Your Order</h2>
              <p className="text-muted-foreground">Review your selection and proceed to payment</p>
            </div>

            {/* Order Summary */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/10">
                <h3 className="font-bold">Order Summary</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Palette className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-medium">{theme.name} Theme</div>
                      <div className="text-sm text-muted-foreground">One-time purchase</div>
                    </div>
                  </div>
                  <div className="font-bold">{currency.symbol}{themePrice.toFixed(2)}</div>
                </div>

                {/* Selected Modules */}
                {selectedModules.filter(id => !MODULES.find(m => m.id === id)?.included).map(moduleId => {
                  const module = MODULES.find(m => m.id === moduleId)
                  if (!module) return null
                  const ModuleIcon = module.icon
                  return (
                    <div key={moduleId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <ModuleIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">{module.name}</div>
                          <div className="text-sm text-muted-foreground">{billingCycle === "yearly" ? "Annual" : "Monthly"} subscription</div>
                        </div>
                      </div>
                      <div className="font-medium">
                        {currency.symbol}{billingCycle === "yearly" ? (module.price * 10).toFixed(0) : module.price.toFixed(2)}
                      </div>
                    </div>
                  )
                })}

                {/* Payment Methods */}
                {selectedPayments.filter(id => PAYMENT_METHODS.find(p => p.id === id)?.price! > 0).map(paymentId => {
                  const payment = PAYMENT_METHODS.find(p => p.id === paymentId)
                  if (!payment) return null
                  const PaymentIcon = payment.icon
                  return (
                    <div key={paymentId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <PaymentIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">{payment.name}</div>
                          <div className="text-sm text-muted-foreground">{billingCycle === "yearly" ? "Annual" : "Monthly"} subscription</div>
                        </div>
                      </div>
                      <div className="font-medium">
                        {currency.symbol}{billingCycle === "yearly" ? (payment.price * 10).toFixed(0) : payment.price.toFixed(2)}
                      </div>
                    </div>
                  )
                })}

                {/* Domain */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {domainOption === "custom" ? customDomain : `${subdomain}.mujeebproai.com`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {domainOption === "custom" ? "Custom domain" : "Free subdomain"}
                      </div>
                    </div>
                  </div>
                  <div className="text-green-400 font-medium">Free</div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="font-bold text-lg">Total</div>
                  <div className="text-right">
                    <div className="font-bold text-2xl text-primary">{currency.symbol}{grandTotal.toFixed(2)}</div>
                    {totalMonthlyPrice > 0 && (
                      <div className="text-sm text-muted-foreground">
                        + {currency.symbol}{totalMonthlyPrice.toFixed(2)}/{billingCycle === "yearly" ? "year" : "month"} for modules
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Business Info Summary */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Business Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                  Edit
                </Button>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business Name</span>
                  <span>{businessInfo.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{businessInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{businessInfo.email || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country</span>
                  <span>{businessInfo.country}</span>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent"
              onClick={processPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay {currency.symbol}{grandTotal.toFixed(2)} & Launch Website
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </div>
        )

      case 6:
        return (
          <div className="space-y-8 text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary"
            />
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Creating Your Website</h2>
              <p className="text-muted-foreground">{creationStatus}</p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${creationProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-sm text-muted-foreground mt-2">{creationProgress}% complete</div>
            </div>

            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              {["Theme", "Settings", "Dashboard", "Website"].map((item, i) => (
                <div 
                  key={item}
                  className={`text-center ${creationProgress >= (i + 1) * 25 ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    creationProgress >= (i + 1) * 25 ? "bg-primary/20" : "bg-white/10"
                  }`}>
                    {creationProgress >= (i + 1) * 25 ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                  </div>
                  <div className="text-xs">{item}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Google Business Setup</h2>
              <p className="text-muted-foreground">Get found on Google Maps and Search</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Search className="w-8 h-8 mb-3 text-blue-400" />
                <h3 className="font-bold mb-1">Appear in Local Search</h3>
                <p className="text-sm text-muted-foreground">Show up when customers search for restaurants near them</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <MapPin className="w-8 h-8 mb-3 text-red-400" />
                <h3 className="font-bold mb-1">Google Maps Listing</h3>
                <p className="text-sm text-muted-foreground">Get directions and location visibility</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Star className="w-8 h-8 mb-3 text-yellow-400" />
                <h3 className="font-bold mb-1">Customer Reviews</h3>
                <p className="text-sm text-muted-foreground">Build trust with Google reviews</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Clock className="w-8 h-8 mb-3 text-green-400" />
                <h3 className="font-bold mb-1">Business Hours</h3>
                <p className="text-sm text-muted-foreground">Show when you&apos;re open</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-6 rounded-xl border-2 transition-all ${
                googleBusiness.assistedSetup ? "border-primary bg-primary/10" : "border-white/10"
              }`}>
                <div className="flex items-start gap-4">
                  <Switch
                    checked={googleBusiness.assistedSetup}
                    onCheckedChange={(checked) => setGoogleBusiness(prev => ({ ...prev, assistedSetup: checked }))}
                  />
                  <div>
                    <div className="font-bold text-lg flex items-center gap-2">
                      Request Assisted Setup
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Recommended</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our team will help you create and verify your Google Business Profile. We&apos;ll contact you via WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                <div className="font-bold mb-2">Already have a Google Business Profile?</div>
                <Input
                  placeholder="Paste your Google Business Profile URL"
                  value={googleBusiness.existingProfileUrl}
                  onChange={(e) => setGoogleBusiness(prev => ({ ...prev, existingProfileUrl: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Example: https://g.page/yourbusiness
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                <div>
                  <div className="font-medium">Show Google Map on Website</div>
                  <p className="text-sm text-muted-foreground">Display your location on a map immediately</p>
                </div>
                <Switch
                  checked={googleBusiness.showMapImmediately}
                  onCheckedChange={(checked) => setGoogleBusiness(prev => ({ ...prev, showMapImmediately: checked }))}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(8)}>
                Skip for Now
              </Button>
              <Button className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent" onClick={() => setCurrentStep(8)}>
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Your Website is Live!</h2>
              <p className="text-muted-foreground">Congratulations! Your website is now ready for customers</p>
            </div>

            {/* Live Website URL */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10">
              <div className="text-sm text-muted-foreground mb-2">Your Live Website</div>
              <div className="flex items-center justify-center gap-3">
                <a 
                  href={createdSite?.liveUrl || `https://${subdomain}.mujeebproai.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-bold text-primary hover:underline"
                >
                  {subdomain}.mujeebproai.com
                </a>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(createdSite?.liveUrl || `https://${subdomain}.mujeebproai.com`)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <a href={createdSite?.liveUrl || `https://${subdomain}.mujeebproai.com`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold">Dashboard</div>
                    <div className="text-xs text-muted-foreground">Manage your website</div>
                  </div>
                </div>
                <Button className="w-full" variant="outline" asChild>
                  <a href={createdSite?.dashboardUrl || `/dashboard/sites/${createdSite?.id}`}>
                    Open Dashboard
                  </a>
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="font-bold">View Website</div>
                    <div className="text-xs text-muted-foreground">See your live site</div>
                  </div>
                </div>
                <Button className="w-full" variant="outline" asChild>
                  <a href={createdSite?.liveUrl || `https://${subdomain}.mujeebproai.com`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              </div>
            </div>

            {/* Login Details */}
            {createdSite?.adminLogin && (
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-left">
                <div className="font-bold mb-3">Login Details</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-2">
                      <span>{createdSite.adminLogin.email}</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createdSite.adminLogin.email)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <span className="text-xs">{createdSite.adminLogin.tempPassword}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Google Business Status */}
            {googleBusiness.assistedSetup && (
              <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-left">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="font-bold">Google Business Setup Requested</div>
                    <div className="text-sm text-muted-foreground">
                      Our team will contact you via WhatsApp to complete your Google Business Profile setup.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="text-left space-y-3">
              <div className="font-bold">Next Steps</div>
              <div className="space-y-2">
                {[
                  "Add your menu items in the dashboard",
                  "Upload photos to your gallery",
                  "Set up your payment methods",
                  "Share your website with customers",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Button className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent" asChild>
                <a href={createdSite?.dashboardUrl || `/dashboard/sites/${createdSite?.id}`}>
                  <Sparkles className="w-4 h-4" />
                  Go to Dashboard
                </a>
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold">Website Launch Wizard</h2>
                <p className="text-sm text-muted-foreground">{theme.name} Theme</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          {currentStep < 8 && (
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {STEPS.slice(0, 5).map((step, index) => {
                  const StepIcon = step.icon
                  const isActive = currentStep === step.id
                  const isComplete = currentStep > step.id
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : isComplete
                              ? "bg-green-500/20 text-green-400"
                              : "bg-white/10 text-muted-foreground"
                          }`}
                        >
                          {isComplete ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                        </div>
                        <span className={`text-xs mt-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                          {step.title}
                        </span>
                      </div>
                      {index < 4 && (
                        <div
                          className={`w-12 h-0.5 mx-2 ${
                            isComplete ? "bg-green-500/50" : "bg-white/10"
                          }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
         {currentStep !== 8 && (
            <div className="shrink-0 bg-[#0b0b10] p-4 border-t border-white/10 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <Button onClick={nextStep} className="gap-2 bg-gradient-to-r from-primary to-accent">
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
