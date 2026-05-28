"use client"

import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import { 
  MapPin, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building2,
  Globe,
  Phone,
  Mail,
  Camera,
  Star,
  MessageSquare,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  HelpCircle,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

interface GoogleBusinessData {
  google_business_profile_url: string | null
  google_place_id: string | null
  google_verification_status: string
  google_connected_email: string | null
  google_last_sync_at: string | null
  google_setup_notes: string | null
  google_assisted_setup: boolean
  google_setup_requested_at: string | null
  latitude: number | null
  longitude: number | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  not_started: { label: "Not Started", color: "bg-gray-500", icon: AlertCircle },
  pending_verification: { label: "Pending Verification", color: "bg-yellow-500", icon: Clock },
  verification_in_progress: { label: "Verification In Progress", color: "bg-blue-500", icon: Clock },
  verified: { label: "Verified", color: "bg-green-500", icon: CheckCircle },
  suspended: { label: "Suspended", color: "bg-red-500", icon: AlertCircle },
  assisted_setup_requested: { label: "Setup Requested", color: "bg-purple-500", icon: Sparkles },
  assisted_setup_in_progress: { label: "Setup In Progress", color: "bg-indigo-500", icon: Clock },
}

const BENEFITS = [
  { icon: Globe, title: "Appear on Google Maps", description: "Get found by customers searching for businesses like yours" },
  { icon: Star, title: "Collect Reviews", description: "Build trust with customer reviews and ratings" },
  { icon: Phone, title: "Direct Contact", description: "Let customers call or message you directly" },
  { icon: Camera, title: "Showcase Photos", description: "Display your products, services, and location" },
  { icon: MessageSquare, title: "Customer Q&A", description: "Answer questions from potential customers" },
  { icon: Building2, title: "Business Info", description: "Share hours, services, and special offers" },
]

export default function GoogleBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<"overview" | "setup" | "assisted">("overview")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    businessName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    category: "",
    description: "",
    notes: "",
  })

  const { data: settingsData, mutate } = useSWR(
    `/api/customer/sites/${id}/settings`,
    fetcher
  )
  
  const { data: siteData } = useSWR(
    `/api/customer/sites/${id}`,
    fetcher
  )

  const settings = settingsData?.settings as GoogleBusinessData | undefined
  const site = siteData?.site

  useEffect(() => {
    if (settings && site) {
      setFormData({
        businessName: settings.google_setup_notes ? "" : (site.site_name || ""),
        address: settings.google_setup_notes ? "" : (settingsData?.settings?.address || ""),
        phone: settings.google_setup_notes ? "" : (settingsData?.settings?.phone || ""),
        email: settings.google_setup_notes ? "" : (settingsData?.settings?.email || ""),
        website: site.subdomain ? `https://${site.subdomain}.mujeebproai.com` : "",
        category: settingsData?.settings?.business_category || "",
        description: "",
        notes: settings.google_setup_notes || "",
      })
    }
  }, [settings, site, settingsData])

  const handleCopyUrl = () => {
    if (settings?.google_business_profile_url) {
      navigator.clipboard.writeText(settings.google_business_profile_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("URL copied to clipboard")
    }
  }

  const handleRequestAssistedSetup = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/customer/sites/${id}/google-business/request-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        toast.success("Setup request submitted! Our team will contact you within 24-48 hours.")
        mutate()
        setActiveTab("overview")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to submit request")
      }
    } catch {
      toast.error("Failed to submit request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveProfileUrl = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/customer/sites/${id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          google_business_profile_url: formData.website,
          google_verification_status: "pending_verification",
        }),
      })
      
      if (res.ok) {
        toast.success("Google Business Profile URL saved")
        mutate()
      } else {
        toast.error("Failed to save URL")
      }
    } catch {
      toast.error("Failed to save URL")
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusConfig = STATUS_CONFIG[settings?.google_verification_status || "not_started"]
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Google Business Profile</h1>
          <p className="text-muted-foreground">
            Get found on Google Maps and Search
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig.color} text-white gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {[
          { id: "overview", label: "Overview" },
          { id: "setup", label: "Self Setup" },
          { id: "assisted", label: "Assisted Setup" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Current Status Card */}
          {settings?.google_business_profile_url ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  Google Business Profile Connected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input 
                    value={settings.google_business_profile_url} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button asChild>
                    <a href={settings.google_business_profile_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </a>
                  </Button>
                </div>
                {settings.google_last_sync_at && (
                  <p className="text-sm text-muted-foreground">
                    Last synced: {new Date(settings.google_last_sync_at).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : settings?.google_verification_status?.includes("assisted") ? (
            <Card className="border-purple-500/30 bg-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-500">
                  <Sparkles className="w-5 h-5" />
                  Assisted Setup {settings.google_verification_status === "assisted_setup_requested" ? "Requested" : "In Progress"}
                </CardTitle>
                <CardDescription>
                  Our team is working on setting up your Google Business Profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <Clock className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Expected completion: 24-48 hours</p>
                      <p className="text-sm text-muted-foreground">
                        Requested on {settings.google_setup_requested_at ? new Date(settings.google_setup_requested_at).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  {settings.google_setup_notes && (
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium mb-1">Your Notes:</p>
                      <p className="text-sm text-muted-foreground">{settings.google_setup_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Get Found on Google
                </CardTitle>
                <CardDescription>
                  A Google Business Profile helps customers find your business on Google Search and Maps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {BENEFITS.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <benefit.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{benefit.title}</p>
                        <p className="text-xs text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button onClick={() => setActiveTab("setup")} variant="outline" className="flex-1">
                    Set Up Myself
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button onClick={() => setActiveTab("assisted")} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Request Assisted Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          {settings?.google_business_profile_url && (
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Globe className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">Active</p>
                      <p className="text-sm text-muted-foreground">Profile Status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{settings.google_verification_status === "verified" ? "Yes" : "Pending"}</p>
                      <p className="text-sm text-muted-foreground">Verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <MapPin className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{settings.latitude ? "Set" : "Not Set"}</p>
                      <p className="text-sm text-muted-foreground">Location</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      )}

      {/* Self Setup Tab */}
      {activeTab === "setup" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Set Up Google Business Profile Yourself</CardTitle>
              <CardDescription>
                Follow these steps to create and verify your business profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Create or Claim Your Business</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go to Google Business Profile and search for your business. If it exists, claim it. If not, create a new profile.
                  </p>
                  <Button asChild variant="outline">
                    <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Google Business
                    </a>
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Fill In Your Business Details</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add your business name, address, phone number, website, hours, and photos.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Business Name</p>
                      <p className="font-medium">{site?.site_name || "Your Business"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <p className="font-medium">{site?.subdomain ? `${site.subdomain}.mujeebproai.com` : "Your Website"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Verify Your Business</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Google will send you a verification code by mail, phone, or email. Enter this code to verify ownership.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Link Your Profile Here</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Once verified, paste your Google Business Profile URL below to track it.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://g.page/your-business"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="flex-1"
                    />
                    <Button onClick={handleSaveProfileUrl} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Need Help?</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Setting up a Google Business Profile can be tricky. We can do it for you!
                  </p>
                  <Button onClick={() => setActiveTab("assisted")} variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Request Assisted Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Assisted Setup Tab */}
      {activeTab === "assisted" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-purple-500/30">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Assisted Google Business Setup
              </CardTitle>
              <CardDescription>
                Let our team set up and optimize your Google Business Profile for you
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name *</Label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Your Business Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Category *</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Restaurant, Cafe, Pizza Shop"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Full Business Address *</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street, City, Postcode, Country"
                  rows={2}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+44 20 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@yourbusiness.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Business Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your business, services, and what makes you special..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any specific requirements or information we should know..."
                  rows={2}
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-medium">What we will do for you:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Create or claim your Google Business Profile
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Optimize your profile with keywords and categories
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Add your business hours and contact details
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Upload photos if provided
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Guide you through the verification process
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">Free Setup Service</p>
                  <p className="text-sm text-muted-foreground">Included with your theme purchase</p>
                </div>
                <Button 
                  onClick={handleRequestAssistedSetup}
                  disabled={isSubmitting || !formData.businessName || !formData.address || !formData.phone || !formData.email}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Request Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
