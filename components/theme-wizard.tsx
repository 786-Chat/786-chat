"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
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
  Users,
  Printer,
  Heart,
  MapPin,
  Check,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"

interface ThemeWizardProps {
  theme: {
    id: string
    name: string
    category: string
    price: number
    description: string
    features: string[]
  }
  onClose: () => void
}

// Module definitions with pricing
const MODULES = [
  { id: "driver", name: "Driver System", description: "Real-time driver tracking & assignments", price: 9.99, icon: Truck },
  { id: "kitchen", name: "Kitchen Display", description: "Live order management for kitchen staff", price: 7.99, icon: ChefHat },
  { id: "whatsapp", name: "WhatsApp Ordering", description: "Accept orders via WhatsApp", price: 5.99, icon: MessageSquare },
  { id: "booking", name: "Booking System", description: "Table reservations & appointments", price: 8.99, icon: Calendar },
  { id: "loyalty", name: "Loyalty System", description: "Points & rewards for customers", price: 6.99, icon: Heart },
  { id: "qrmenu", name: "QR Menu", description: "Contactless menu scanning", price: 4.99, icon: QrCode },
  { id: "multibranch", name: "Multi Branch", description: "Manage multiple locations", price: 14.99, icon: MapPin },
  { id: "printing", name: "Receipt Printing", description: "Thermal printer integration", price: 5.99, icon: Printer },
]

const COUNTRIES = [
  "United Kingdom", "United States", "Canada", "Australia", "Germany", "France", 
  "Spain", "Italy", "Netherlands", "Belgium", "Ireland", "Pakistan", "India", 
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman"
]

const CURRENCIES = [
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
]

const STEPS = [
  { id: 1, title: "Business Info", icon: Building2 },
  { id: 2, title: "Theme Options", icon: Palette },
  { id: 3, title: "Modules", icon: Puzzle },
  { id: 4, title: "Domain", icon: Globe },
  { id: 5, title: "Payment", icon: CreditCard },
  { id: 6, title: "Creating...", icon: Rocket },
  { id: 7, title: "Success", icon: CheckCircle2 },
]

export function ThemeWizard({ theme, onClose }: ThemeWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  
  // Step 1 - Business Info
  const [businessInfo, setBusinessInfo] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    country: "United Kingdom",
    currency: "GBP",
    logo: null as File | null,
    logoPreview: ""
  })
  
  // Step 2 - Theme Options
  const [themeOptions, setThemeOptions] = useState({
    colorStyle: "default",
    darkMode: false,
    homepageLayout: "standard",
    menuStyle: "grid",
    deliveryEnabled: true,
    collectionEnabled: true,
    bookingEnabled: false
  })
  
  // Step 3 - Modules
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  
  // Step 4 - Domain
  const [domainOption, setDomainOption] = useState<"subdomain" | "custom">("subdomain")
  const [subdomain, setSubdomain] = useState("")
  const [customDomain, setCustomDomain] = useState("")
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  
  // Step 6/7 - Results
  const [creationResult, setCreationResult] = useState<{
    siteId: string
    websiteUrl: string
    adminUrl: string
    managerEmail: string
    managerPassword: string
  } | null>(null)

  // Calculate pricing
  const basePrice = theme.price
  const modulesPrice = selectedModules.reduce((sum, moduleId) => {
    const module = MODULES.find(m => m.id === moduleId)
    return sum + (module?.price || 0)
  }, 0)
  const monthlyTotal = basePrice + modulesPrice
  const yearlyTotal = monthlyTotal * 10 // 2 months free
  const totalPrice = billingCycle === "monthly" ? monthlyTotal : yearlyTotal

  // Handle logo upload
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo must be under 5MB")
        return
      }
      setBusinessInfo(prev => ({
        ...prev,
        logo: file,
        logoPreview: URL.createObjectURL(file)
      }))
    }
  }, [])

  // Check subdomain availability
  const checkSubdomain = useCallback(async () => {
    if (!subdomain || subdomain.length < 3) return
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

  // Validate current step
  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!businessInfo.businessName.trim()) {
          toast.error("Business name is required")
          return false
        }
        if (!businessInfo.email.trim() || !businessInfo.email.includes("@")) {
          toast.error("Valid email is required")
          return false
        }
        if (!businessInfo.phone.trim()) {
          toast.error("Phone number is required")
          return false
        }
        return true
      case 4:
        if (domainOption === "subdomain" && (!subdomain || subdomain.length < 3)) {
          toast.error("Subdomain must be at least 3 characters")
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

  // Handle next step
  const handleNext = () => {
    if (!validateStep()) return
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    } else if (currentStep === 5) {
      handlePayment()
    }
  }

  // Handle payment and site creation
  const handlePayment = async () => {
    setIsProcessing(true)
    setCurrentStep(6)
    
    try {
      // Create checkout session
      const checkoutRes = await fetch("/api/themes/wizard-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: theme.id,
          themeName: theme.name,
          themePrice: theme.price,
          businessInfo,
          themeOptions,
          selectedModules,
          domainOption,
          subdomain: domainOption === "subdomain" ? subdomain : null,
          customDomain: domainOption === "custom" ? customDomain : null,
          billingCycle,
          totalPrice
        })
      })
      
      if (!checkoutRes.ok) {
        const error = await checkoutRes.json()
        throw new Error(error.error || "Failed to create checkout")
      }
      
      const { url, siteId } = await checkoutRes.json()
      
      if (url) {
        // Redirect to Stripe
        window.location.href = url
      } else if (siteId) {
        // Free trial or direct creation - fetch result
        const resultRes = await fetch(`/api/customer/sites/${siteId}`)
        const result = await resultRes.json()
        
        setCreationResult({
          siteId,
          websiteUrl: `https://${subdomain}.mujeebproai.com`,
          adminUrl: `https://www.mujeebproai.com/dashboard/sites/${siteId}`,
          managerEmail: businessInfo.email,
          managerPassword: "Sent to your email"
        })
        setCurrentStep(7)
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.")
      setCurrentStep(5)
    } finally {
      setIsProcessing(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Tony's Pizza"
                  value={businessInfo.businessName}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessName: e.target.value }))}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  placeholder="e.g., Tony Smith"
                  value={businessInfo.ownerName}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, ownerName: e.target.value }))}
                  className="bg-background/50"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tony@example.com"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+44 7123 456789"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-background/50"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+44 7123 456789"
                  value={businessInfo.whatsapp}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  placeholder="123 High Street, London"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-background/50"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={businessInfo.country}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border bg-background/50 text-sm"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={businessInfo.currency}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border bg-background/50 text-sm"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Business Logo</Label>
              <div className="flex items-center gap-4">
                {businessInfo.logoPreview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={businessInfo.logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setBusinessInfo(prev => ({ ...prev, logo: null, logoPreview: "" }))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Upload</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>Recommended: 512x512px</p>
                  <p>Max size: 5MB</p>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Color Style</Label>
              <RadioGroup 
                value={themeOptions.colorStyle} 
                onValueChange={(v) => setThemeOptions(prev => ({ ...prev, colorStyle: v }))}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                {["default", "warm", "cool", "vibrant"].map(style => (
                  <Label
                    key={style}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      themeOptions.colorStyle === style 
                        ? "border-primary bg-primary/10" 
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={style} className="sr-only" />
                    <div className={`w-10 h-10 rounded-full ${
                      style === "default" ? "bg-gradient-to-br from-primary to-accent" :
                      style === "warm" ? "bg-gradient-to-br from-orange-500 to-red-500" :
                      style === "cool" ? "bg-gradient-to-br from-blue-500 to-cyan-500" :
                      "bg-gradient-to-br from-purple-500 to-pink-500"
                    }`} />
                    <span className="text-sm capitalize">{style}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
              <div className="flex items-center gap-3">
                {themeOptions.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Enable dark color scheme</p>
                </div>
              </div>
              <Switch 
                checked={themeOptions.darkMode}
                onCheckedChange={(v) => setThemeOptions(prev => ({ ...prev, darkMode: v }))}
              />
            </div>
            
            <div className="space-y-4">
              <Label>Homepage Layout</Label>
              <RadioGroup 
                value={themeOptions.homepageLayout} 
                onValueChange={(v) => setThemeOptions(prev => ({ ...prev, homepageLayout: v }))}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { id: "standard", label: "Standard Hero" },
                  { id: "fullscreen", label: "Fullscreen Hero" },
                  { id: "split", label: "Split Layout" },
                  { id: "video", label: "Video Background" }
                ].map(layout => (
                  <Label
                    key={layout.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      themeOptions.homepageLayout === layout.id 
                        ? "border-primary bg-primary/10" 
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={layout.id} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      themeOptions.homepageLayout === layout.id ? "border-primary" : "border-muted-foreground"
                    }`}>
                      {themeOptions.homepageLayout === layout.id && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span>{layout.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-4">
              <Label>Menu Display Style</Label>
              <RadioGroup 
                value={themeOptions.menuStyle} 
                onValueChange={(v) => setThemeOptions(prev => ({ ...prev, menuStyle: v }))}
                className="grid grid-cols-3 gap-3"
              >
                {["grid", "list", "cards"].map(style => (
                  <Label
                    key={style}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      themeOptions.menuStyle === style 
                        ? "border-primary bg-primary/10" 
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={style} className="sr-only" />
                    <span className="capitalize">{style}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-3">
              <Label>Order Options</Label>
              <div className="grid gap-3">
                {[
                  { key: "deliveryEnabled", label: "Delivery", desc: "Accept delivery orders", icon: Truck },
                  { key: "collectionEnabled", label: "Collection", desc: "Accept collection orders", icon: ShoppingBag },
                  { key: "bookingEnabled", label: "Table Booking", desc: "Accept table reservations", icon: Calendar },
                ].map(option => (
                  <div key={option.key} className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
                    <div className="flex items-center gap-3">
                      <option.icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.desc}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={themeOptions[option.key as keyof typeof themeOptions] as boolean}
                      onCheckedChange={(v) => setThemeOptions(prev => ({ ...prev, [option.key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Add optional modules to extend your website functionality. You can add or remove these later.</p>
            
            <div className="grid gap-3">
              {MODULES.map(module => {
                const isSelected = selectedModules.includes(module.id)
                const Icon = module.icon
                
                return (
                  <div
                    key={module.id}
                    onClick={() => {
                      setSelectedModules(prev => 
                        isSelected 
                          ? prev.filter(id => id !== module.id)
                          : [...prev, module.id]
                      )
                    }}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium">{module.name}</p>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary">+£{module.price.toFixed(2)}/mo</span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <RadioGroup value={domainOption} onValueChange={(v) => setDomainOption(v as "subdomain" | "custom")}>
              <Label
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  domainOption === "subdomain" ? "border-primary bg-primary/10" : "border-muted"
                }`}
              >
                <RadioGroupItem value="subdomain" className="mt-1" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-semibold">Free Subdomain</p>
                    <p className="text-sm text-muted-foreground">Get a free .mujeebproai.com subdomain</p>
                  </div>
                  {domainOption === "subdomain" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="your-business"
                          value={subdomain}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                            setSubdomain(value)
                            setSubdomainAvailable(null)
                          }}
                          onBlur={checkSubdomain}
                          className="bg-background/50"
                        />
                        <span className="text-muted-foreground whitespace-nowrap">.mujeebproai.com</span>
                      </div>
                      {checkingSubdomain && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Checking availability...
                        </p>
                      )}
                      {subdomainAvailable === true && (
                        <p className="text-sm text-green-500 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> This subdomain is available!
                        </p>
                      )}
                      {subdomainAvailable === false && (
                        <p className="text-sm text-red-500">This subdomain is already taken</p>
                      )}
                    </div>
                  )}
                </div>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">FREE</span>
              </Label>
              
              <Label
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  domainOption === "custom" ? "border-primary bg-primary/10" : "border-muted"
                }`}
              >
                <RadioGroupItem value="custom" className="mt-1" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-semibold">Custom Domain</p>
                    <p className="text-sm text-muted-foreground">Use your own domain name (requires DNS setup)</p>
                  </div>
                  {domainOption === "custom" && (
                    <Input
                      placeholder="www.yourdomain.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      className="bg-background/50"
                    />
                  )}
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">PRO</span>
              </Label>
            </RadioGroup>
          </div>
        )
        
      case 5:
        const selectedCurrency = CURRENCIES.find(c => c.code === businessInfo.currency) || CURRENCIES[0]
        
        return (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border bg-gradient-to-br from-primary/10 to-accent/10">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{theme.name} Theme</span>
                  <span>£{theme.price.toFixed(2)}/mo</span>
                </div>
                
                {selectedModules.length > 0 && (
                  <>
                    <div className="border-t pt-3 space-y-2">
                      {selectedModules.map(moduleId => {
                        const module = MODULES.find(m => m.id === moduleId)
                        if (!module) return null
                        return (
                          <div key={moduleId} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{module.name}</span>
                            <span>£{module.price.toFixed(2)}/mo</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Domain</span>
                    <span className="text-green-500">FREE</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {domainOption === "subdomain" 
                      ? `${subdomain || "your-site"}.mujeebproai.com`
                      : customDomain || "Custom domain"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Billing Cycle</Label>
              <RadioGroup 
                value={billingCycle} 
                onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  className={`relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    billingCycle === "monthly" ? "border-primary bg-primary/10" : "border-muted"
                  }`}
                >
                  <RadioGroupItem value="monthly" className="sr-only" />
                  <span className="font-semibold">Monthly</span>
                  <span className="text-2xl font-bold mt-2">£{monthlyTotal.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </Label>
                
                <Label
                  className={`relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    billingCycle === "yearly" ? "border-primary bg-primary/10" : "border-muted"
                  }`}
                >
                  <RadioGroupItem value="yearly" className="sr-only" />
                  <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-medium">
                    Save 17%
                  </span>
                  <span className="font-semibold">Yearly</span>
                  <span className="text-2xl font-bold mt-2">£{yearlyTotal.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">/year</span>
                </Label>
              </RadioGroup>
            </div>
            
            <div className="p-4 rounded-lg border bg-primary/5">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Due Today</span>
                <span className="text-2xl font-bold text-primary">
                  £{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )
        
      case 6:
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <Rocket className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Creating Your Website...</h3>
              <p className="text-muted-foreground">This may take a few moments</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" /> Processing payment
              </p>
              <p className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Setting up your website
              </p>
              <p className="flex items-center gap-2 opacity-50">
                <div className="w-4 h-4" /> Creating admin dashboard
              </p>
              <p className="flex items-center gap-2 opacity-50">
                <div className="w-4 h-4" /> Configuring modules
              </p>
            </div>
          </div>
        )
        
      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Congratulations!</h3>
                <p className="text-muted-foreground">Your website has been created successfully</p>
              </div>
            </div>
            
            {creationResult && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-background/50 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Website URL</p>
                    <a 
                      href={creationResult.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline"
                    >
                      {creationResult.websiteUrl}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Dashboard</p>
                    <a 
                      href={creationResult.adminUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline"
                    >
                      {creationResult.adminUrl}
                    </a>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-primary/5 space-y-2">
                  <p className="font-semibold">Login Credentials</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{creationResult.managerEmail}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Password</p>
                      <p className="font-medium">{creationResult.managerPassword}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border space-y-3">
                  <p className="font-semibold">Next Steps</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Visit your new website and explore the design</li>
                    <li>Log in to your admin dashboard</li>
                    <li>Customize your menu, logo, and business info</li>
                    <li>Set up your payment methods</li>
                    <li>Start accepting orders!</li>
                  </ol>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => creationResult && router.push(creationResult.adminUrl)}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border bg-background shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
            <div>
              <h2 className="text-xl font-bold">Setup Your Website</h2>
              <p className="text-sm text-muted-foreground">{theme.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Steps indicator */}
          {currentStep < 6 && (
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                {STEPS.slice(0, 5).map((step, index) => {
                  const isActive = step.id === currentStep
                  const isCompleted = step.id < currentStep
                  const Icon = step.icon
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center gap-2 ${
                        isActive ? "text-primary" : isCompleted ? "text-green-500" : "text-muted-foreground"
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          isActive ? "bg-primary text-primary-foreground" : 
                          isCompleted ? "bg-green-500 text-white" : "bg-muted"
                        }`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                      </div>
                      {index < 4 && (
                        <div className={`w-8 h-0.5 mx-2 ${
                          isCompleted ? "bg-green-500" : "bg-muted"
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {renderStepContent()}
          </div>
          
          {/* Footer */}
          {currentStep < 6 && (
            <div className="sticky bottom-0 flex items-center justify-between p-4 border-t bg-background/95 backdrop-blur-sm">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button onClick={handleNext} disabled={isProcessing}>
                {currentStep === 5 ? (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay £{totalPrice.toFixed(2)}
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
