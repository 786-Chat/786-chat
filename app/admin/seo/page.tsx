"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Search, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Globe,
  FileText,
  Image,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SEOSettings {
  title: string
  description: string
  keywords: string
  og_image: string
}

interface SEOData {
  [page: string]: SEOSettings
}

const defaultPages = [
  { id: "home", name: "Homepage", icon: Globe },
  { id: "pricing", name: "Pricing Page", icon: Tag },
  { id: "login", name: "Login Page", icon: FileText },
  { id: "register", name: "Register Page", icon: FileText },
]

export default function AdminSEOPage() {
  const [seo, setSeo] = useState<SEOData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    fetchSEO()
  }, [])

  const fetchSEO = async () => {
    try {
      const res = await fetch("/api/admin/seo", { credentials: "include" })
      const data = await res.json()
      setSeo(data.seo || {})
    } catch (error) {
      console.error("Error fetching SEO:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSEO = async (page: string) => {
    setIsSaving(page)
    setSaveStatus("idle")
    try {
      const settings = seo[page] || { title: "", description: "", keywords: "", og_image: "" }
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, ...settings }),
        credentials: "include"
      })
      if (res.ok) {
        setSaveStatus("success")
        setTimeout(() => setSaveStatus("idle"), 3000)
      } else {
        setSaveStatus("error")
      }
    } catch (error) {
      console.error("Error saving SEO:", error)
      setSaveStatus("error")
    } finally {
      setIsSaving(null)
    }
  }

  const updateSEO = (page: string, field: keyof SEOSettings, value: string) => {
    setSeo(prev => ({
      ...prev,
      [page]: { ...prev[page], [field]: value }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Search className="w-8 h-8 text-orange-400" />
            SEO Settings
          </h1>
          <p className="text-muted-foreground mt-1">Optimize your pages for search engines</p>
        </div>
        {saveStatus === "success" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-green-500"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Saved successfully!</span>
          </motion.div>
        )}
      </div>

      {/* SEO Cards for each page */}
      <div className="space-y-6">
        {defaultPages.map((page, index) => {
          const Icon = page.icon
          const pageData = seo[page.id] || { title: "", description: "", keywords: "", og_image: "" }
          
          return (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-orange-400" />
                    {page.name}
                  </CardTitle>
                  <CardDescription>SEO settings for /{page.id === "home" ? "" : page.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Page Title
                      </label>
                      <Input
                        value={pageData.title || ""}
                        onChange={(e) => updateSEO(page.id, "title", e.target.value)}
                        placeholder="MujeebProAI - Your Page Title"
                        className="bg-background/50"
                      />
                      <p className="text-xs text-muted-foreground">{(pageData.title || "").length}/60 characters</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        OG Image URL
                      </label>
                      <Input
                        value={pageData.og_image || ""}
                        onChange={(e) => updateSEO(page.id, "og_image", e.target.value)}
                        placeholder="https://example.com/og-image.jpg"
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meta Description</label>
                    <textarea
                      value={pageData.description || ""}
                      onChange={(e) => updateSEO(page.id, "description", e.target.value)}
                      placeholder="A compelling description of your page for search results..."
                      className="w-full h-20 px-3 py-2 rounded-md bg-background/50 border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground">{(pageData.description || "").length}/160 characters recommended</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Keywords (comma separated)
                    </label>
                    <Input
                      value={pageData.keywords || ""}
                      onChange={(e) => updateSEO(page.id, "keywords", e.target.value)}
                      placeholder="AI, machine learning, automation, MujeebProAI"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-muted-foreground">
                      Preview: <span className="text-green-400">{page.id === "home" ? "mujeebproai.com" : `mujeebproai.com/${page.id}`}</span>
                    </div>
                    <Button 
                      onClick={() => saveSEO(page.id)}
                      disabled={isSaving === page.id}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      {isSaving === page.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save SEO
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
