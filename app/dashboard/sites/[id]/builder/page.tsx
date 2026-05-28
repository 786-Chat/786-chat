"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Save, 
  Eye, 
  Loader2, 
  ArrowLeft,
  Palette,
  Type,
  Layout,
  Image as ImageIcon,
  Settings,
  Globe,
  Monitor,
  Tablet,
  Smartphone,
  Undo,
  Redo,
  Copy,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

interface SiteConfig {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  borderRadius: string
}

interface SiteContent {
  hero: {
    title: string
    subtitle: string
    ctaText: string
    ctaLink: string
    backgroundImage?: string
  }
  about: {
    title: string
    description: string
    image?: string
  }
  features: Array<{
    title: string
    description: string
    icon: string
  }>
  contact: {
    email: string
    phone: string
    address: string
  }
  footer: {
    copyright: string
    socialLinks: {
      twitter?: string
      facebook?: string
      linkedin?: string
      instagram?: string
    }
  }
}

interface Site {
  id: string
  site_name: string
  subdomain: string
  custom_domain: string | null
  site_config: SiteConfig
  site_content: SiteContent
  logo_url: string | null
  favicon_url: string | null
  is_published: boolean
  theme_name: string
  theme_slug: string
}

const defaultConfig: SiteConfig = {
  primaryColor: "#3b82f6",
  secondaryColor: "#10b981",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  fontFamily: "Inter",
  borderRadius: "8px"
}

const defaultContent: SiteContent = {
  hero: {
    title: "Welcome to My Site",
    subtitle: "Built with MujeebProAI Themes",
    ctaText: "Get Started",
    ctaLink: "#contact"
  },
  about: {
    title: "About Us",
    description: "We are a company dedicated to providing excellent services."
  },
  features: [
    { title: "Feature 1", description: "Description of feature 1", icon: "star" },
    { title: "Feature 2", description: "Description of feature 2", icon: "zap" },
    { title: "Feature 3", description: "Description of feature 3", icon: "shield" }
  ],
  contact: {
    email: "contact@example.com",
    phone: "+1 234 567 890",
    address: "123 Main Street"
  },
  footer: {
    copyright: "© 2024 My Company. All rights reserved.",
    socialLinks: {}
  }
}

export default function SiteBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [site, setSite] = useState<Site | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [config, setConfig] = useState<SiteConfig>(defaultConfig)
  const [content, setContent] = useState<SiteContent>(defaultContent)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [activeTab, setActiveTab] = useState("design")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/customer/sites/${params.id}`, { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setSite(data.site)
          setConfig({ ...defaultConfig, ...data.site.site_config })
          setContent({ ...defaultContent, ...data.site.site_content })
        } else {
          router.push("/dashboard/sites")
        }
      } catch (error) {
        console.error("Failed to fetch site:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user && params.id) {
      fetchSite()
    }
  }, [user, params.id, router])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      const res = await fetch(`/api/customer/sites/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_config: config,
          site_content: content
        }),
        credentials: "include"
      })

      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      await fetch(`/api/customer/sites/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !site?.is_published }),
        credentials: "include"
      })
      
      if (site) {
        setSite({ ...site, is_published: !site.is_published })
      }
    } catch (error) {
      console.error("Failed to toggle publish:", error)
    }
  }

  const copyUrl = () => {
    if (site) {
      navigator.clipboard.writeText(`https://${site.subdomain}.mujeebproai.com`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const updateConfig = (key: keyof SiteConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const updateContent = (section: keyof SiteContent, key: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [key]: value
      }
    }))
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!site) return null

  const previewWidth = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px"
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/sites">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="font-semibold text-sm">{site.site_name}</h1>
            <p className="text-xs text-muted-foreground">{site.theme_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Preview Toggle */}
          <div className="flex items-center border rounded-lg p-1 bg-muted/50">
            <Button
              variant={previewDevice === "desktop" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setPreviewDevice("desktop")}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewDevice === "tablet" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setPreviewDevice("tablet")}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={previewDevice === "mobile" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setPreviewDevice("mobile")}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Site URL */}
          <Button variant="outline" size="sm" onClick={copyUrl}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {site.subdomain}.mujeebproai.com
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Save Button */}
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saveSuccess ? "Saved!" : "Save"}
          </Button>

          {/* Publish Button */}
          <Button 
            size="sm"
            variant={site.is_published ? "secondary" : "default"}
            onClick={handlePublish}
          >
            <Globe className="w-4 h-4 mr-2" />
            {site.is_published ? "Unpublish" : "Publish"}
          </Button>

          {/* Preview Button */}
          {site.is_published && (
            <Button size="sm" variant="outline" asChild>
              <a 
                href={`https://${site.subdomain}.mujeebproai.com`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Live
              </a>
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-80 bg-background border-r border-border overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 p-1 m-2">
              <TabsTrigger value="design" className="text-xs">
                <Palette className="w-3 h-3 mr-1" />
                Design
              </TabsTrigger>
              <TabsTrigger value="content" className="text-xs">
                <Type className="w-3 h-3 mr-1" />
                Content
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>

            <div className="p-4">
              {/* Design Tab */}
              <TabsContent value="design" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <Label className="text-xs">Primary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={config.primaryColor}
                          onChange={(e) => updateConfig("primaryColor", e.target.value)}
                          className="w-12 h-8 p-0 border-0"
                        />
                        <Input
                          value={config.primaryColor}
                          onChange={(e) => updateConfig("primaryColor", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Secondary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={config.secondaryColor}
                          onChange={(e) => updateConfig("secondaryColor", e.target.value)}
                          className="w-12 h-8 p-0 border-0"
                        />
                        <Input
                          value={config.secondaryColor}
                          onChange={(e) => updateConfig("secondaryColor", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={config.backgroundColor}
                          onChange={(e) => updateConfig("backgroundColor", e.target.value)}
                          className="w-12 h-8 p-0 border-0"
                        />
                        <Input
                          value={config.backgroundColor}
                          onChange={(e) => updateConfig("backgroundColor", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={config.textColor}
                          onChange={(e) => updateConfig("textColor", e.target.value)}
                          className="w-12 h-8 p-0 border-0"
                        />
                        <Input
                          value={config.textColor}
                          onChange={(e) => updateConfig("textColor", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Typography</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Label className="text-xs">Font Family</Label>
                    <select
                      value={config.fontFamily}
                      onChange={(e) => updateConfig("fontFamily", e.target.value)}
                      className="w-full h-8 mt-1 text-xs rounded-md border border-input bg-background px-2"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Playfair Display">Playfair Display</option>
                    </select>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Hero Section</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={content.hero.title}
                        onChange={(e) => updateContent("hero", "title", e.target.value)}
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Subtitle</Label>
                      <Textarea
                        value={content.hero.subtitle}
                        onChange={(e) => updateContent("hero", "subtitle", e.target.value)}
                        className="mt-1 text-xs min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Button Text</Label>
                      <Input
                        value={content.hero.ctaText}
                        onChange={(e) => updateContent("hero", "ctaText", e.target.value)}
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Button Link</Label>
                      <Input
                        value={content.hero.ctaLink}
                        onChange={(e) => updateContent("hero", "ctaLink", e.target.value)}
                        className="h-8 mt-1 text-xs"
                        placeholder="#contact"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">About Section</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={content.about.title}
                        onChange={(e) => updateContent("about", "title", e.target.value)}
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={content.about.description}
                        onChange={(e) => updateContent("about", "description", e.target.value)}
                        className="mt-1 text-xs min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Contact Info</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        value={content.contact.email}
                        onChange={(e) => updateContent("contact", "email", e.target.value)}
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={content.contact.phone}
                        onChange={(e) => updateContent("contact", "phone", e.target.value)}
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Address</Label>
                      <Input
                        value={content.contact.address}
                        onChange={(e) => updateContent("contact", "address", e.target.value)}
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Footer</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <Label className="text-xs">Copyright Text</Label>
                      <Input
                        value={content.footer.copyright}
                        onChange={(e) => updateContent("footer", "copyright", e.target.value)}
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Site Info</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <Label className="text-xs">Site Name</Label>
                      <Input
                        value={site.site_name}
                        className="h-8 mt-1 text-xs"
                        disabled
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Subdomain</Label>
                      <Input
                        value={`${site.subdomain}.mujeebproai.com`}
                        className="h-8 mt-1 text-xs"
                        disabled
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Publishing</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs">Site Published</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Make your site visible to the public
                        </p>
                      </div>
                      <Switch
                        checked={site.is_published}
                        onCheckedChange={handlePublish}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </aside>

        {/* Preview Area */}
        <main className="flex-1 p-4 overflow-auto">
          <div 
            className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
            style={{ 
              width: previewWidth[previewDevice],
              maxWidth: "100%",
              minHeight: "calc(100vh - 120px)"
            }}
          >
            {/* Live Preview with applied styles */}
            <div 
              style={{ 
                fontFamily: config.fontFamily,
                backgroundColor: config.backgroundColor,
                color: config.textColor
              }}
            >
              {/* Hero Preview */}
              <section 
                className="py-20 px-8 text-center"
                style={{ backgroundColor: config.primaryColor }}
              >
                <h1 className="text-4xl font-bold text-white mb-4">
                  {content.hero.title}
                </h1>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  {content.hero.subtitle}
                </p>
                <button 
                  className="px-8 py-3 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: config.secondaryColor }}
                >
                  {content.hero.ctaText}
                </button>
              </section>

              {/* About Preview */}
              <section className="py-16 px-8">
                <h2 className="text-3xl font-bold text-center mb-6">
                  {content.about.title}
                </h2>
                <p className="text-lg text-center max-w-3xl mx-auto opacity-80">
                  {content.about.description}
                </p>
              </section>

              {/* Contact Preview */}
              <section 
                className="py-16 px-8"
                style={{ backgroundColor: config.primaryColor + "10" }}
              >
                <h2 className="text-3xl font-bold text-center mb-8">Contact Us</h2>
                <div className="flex flex-wrap justify-center gap-8 text-center">
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="opacity-80">{content.contact.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="opacity-80">{content.contact.phone}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Address</p>
                    <p className="opacity-80">{content.contact.address}</p>
                  </div>
                </div>
              </section>

              {/* Footer Preview */}
              <footer 
                className="py-6 px-8 text-center text-sm"
                style={{ backgroundColor: config.textColor, color: config.backgroundColor }}
              >
                {content.footer.copyright}
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
