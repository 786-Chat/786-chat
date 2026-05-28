"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Type,
  Quote,
  User,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HeroContent {
  title: string
  subtitle: string
  description: string
  primaryCta: string
  secondaryCta: string
}

interface FounderContent {
  name: string
  title: string
  bio: string
  stats: Array<{ label: string; value: string }>
}

interface ContentData {
  hero?: HeroContent
  founder?: FounderContent
}

export default function AdminContentPage() {
  const [content, setContent] = useState<ContentData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const res = await fetch("/api/admin/content", { credentials: "include" })
      const data = await res.json()
      setContent(data.content || {})
    } catch (error) {
      console.error("Error fetching content:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveContent = async (key: string, value: unknown) => {
    setIsSaving(true)
    setSaveStatus("idle")
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
        credentials: "include"
      })
      if (res.ok) {
        setSaveStatus("success")
        setTimeout(() => setSaveStatus("idle"), 3000)
      } else {
        setSaveStatus("error")
      }
    } catch (error) {
      console.error("Error saving content:", error)
      setSaveStatus("error")
    } finally {
      setIsSaving(false)
    }
  }

  const updateHero = (field: keyof HeroContent, value: string) => {
    setContent(prev => ({
      ...prev,
      hero: { ...prev.hero!, [field]: value }
    }))
  }

  const updateFounder = (field: keyof FounderContent, value: string | Array<{ label: string; value: string }>) => {
    setContent(prev => ({
      ...prev,
      founder: { ...prev.founder!, [field]: value }
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
            <FileText className="w-8 h-8 text-cyan-400" />
            Website Content
          </h1>
          <p className="text-muted-foreground mt-1">Edit homepage text, hero section, and founder information</p>
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
        {saveStatus === "error" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-500"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Failed to save</span>
          </motion.div>
        )}
      </div>

      {/* Hero Section Editor */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Hero Section
          </CardTitle>
          <CardDescription>Edit the main headline and call-to-action buttons on the homepage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Type className="w-4 h-4" />
                Main Title
              </label>
              <Input
                value={content.hero?.title || ""}
                onChange={(e) => updateHero("title", e.target.value)}
                placeholder="The Future of AI is Here"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Quote className="w-4 h-4" />
                Subtitle / Tagline
              </label>
              <Input
                value={content.hero?.subtitle || ""}
                onChange={(e) => updateHero("subtitle", e.target.value)}
                placeholder="Smart AI Solutions for Everyone"
                className="bg-background/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={content.hero?.description || ""}
              onChange={(e) => updateHero("description", e.target.value)}
              placeholder="Build transformative AI experiences..."
              className="w-full h-24 px-3 py-2 rounded-md bg-background/50 border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Button Text</label>
              <Input
                value={content.hero?.primaryCta || ""}
                onChange={(e) => updateHero("primaryCta", e.target.value)}
                placeholder="Start Free Trial"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secondary Button Text</label>
              <Input
                value={content.hero?.secondaryCta || ""}
                onChange={(e) => updateHero("secondaryCta", e.target.value)}
                placeholder="Watch Demo"
                className="bg-background/50"
              />
            </div>
          </div>
          <Button 
            onClick={() => saveContent("hero", content.hero)}
            disabled={isSaving}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Hero Content
          </Button>
        </CardContent>
      </Card>

      {/* Founder Section Editor */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            Founder / CEO Section
          </CardTitle>
          <CardDescription>Edit the founder information displayed on the homepage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={content.founder?.name || ""}
                onChange={(e) => updateFounder("name", e.target.value)}
                placeholder="Mujeeb Sardar"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={content.founder?.title || ""}
                onChange={(e) => updateFounder("title", e.target.value)}
                placeholder="CEO & Founder"
                className="bg-background/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Biography</label>
            <textarea
              value={content.founder?.bio || ""}
              onChange={(e) => updateFounder("bio", e.target.value)}
              placeholder="I am Mujeeb Sardar, the founder of MujeebProAI..."
              className="w-full h-32 px-3 py-2 rounded-md bg-background/50 border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Stats (comma separated: label:value)</label>
            <Input
              value={content.founder?.stats?.map(s => `${s.label}:${s.value}`).join(", ") || ""}
              onChange={(e) => {
                const stats = e.target.value.split(",").map(s => {
                  const [label, value] = s.trim().split(":")
                  return { label: label?.trim() || "", value: value?.trim() || "" }
                }).filter(s => s.label && s.value)
                updateFounder("stats", stats)
              }}
              placeholder="Years in AI:5+, Projects:50+, Passion:100%"
              className="bg-background/50"
            />
          </div>
          <Button 
            onClick={() => saveContent("founder", content.founder)}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Founder Content
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
