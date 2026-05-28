"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Youtube, 
  Facebook, 
  Instagram, 
  Linkedin,
  MessageCircle,
  Save,
  Loader2,
  ExternalLink,
  Check
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

interface SocialLinks {
  youtube: string
  facebook: string
  tiktok: string
  instagram: string
  linkedin: string
  whatsapp: string
}

const defaultLinks: SocialLinks = {
  youtube: "",
  facebook: "",
  tiktok: "",
  instagram: "",
  linkedin: "",
  whatsapp: ""
}

const socialFields = [
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://www.youtube.com/@yourchannel", color: "text-red-500" },
  { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://www.facebook.com/yourpage", color: "text-blue-500" },
  { key: "tiktok", label: "TikTok", icon: TikTokIcon, placeholder: "https://www.tiktok.com/@youraccount", color: "text-foreground" },
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://www.instagram.com/youraccount", color: "text-pink-500" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://www.linkedin.com/company/yourcompany", color: "text-blue-600" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "https://wa.me/1234567890", color: "text-green-500" },
]

export default function AdminSocialLinksPage() {
  const [links, setLinks] = useState<SocialLinks>(defaultLinks)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/admin/social-links")
      if (res.ok) {
        const data = await res.json()
        if (data.links) {
          setLinks({ ...defaultLinks, ...data.links })
        }
      }
    } catch (error) {
      console.error("Failed to fetch social links:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links })
      })
      
      if (res.ok) {
        toast.success("Social links saved successfully!")
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        toast.error("Failed to save social links")
      }
    } catch (error) {
      toast.error("Failed to save social links")
    } finally {
      setSaving(false)
    }
  }

  const updateLink = (key: string, value: string) => {
    setLinks(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white">Social Media Links</h1>
        <p className="text-white/60 mt-1">
          Manage social media links displayed in the footer and homepage
        </p>
      </motion.div>

      <Card className="bg-[#0d0d14]/80 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Social Profiles</CardTitle>
          <CardDescription>
            Enter URLs for your social media profiles. Leave blank to hide a platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {socialFields.map((field, index) => {
            const IconComponent = field.icon
            return (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-2"
              >
                <Label htmlFor={field.key} className="flex items-center gap-2 text-white">
                  <IconComponent className={`w-5 h-5 ${field.color}`} />
                  {field.label}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={field.key}
                    value={links[field.key as keyof SocialLinks]}
                    onChange={(e) => updateLink(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  {links[field.key as keyof SocialLinks] && (
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className="shrink-0 border-white/10 hover:bg-white/5"
                    >
                      <a href={links[field.key as keyof SocialLinks]} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}

          <div className="pt-4 border-t border-white/10">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-[#0d0d14]/80 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Preview</CardTitle>
          <CardDescription>
            This is how your social icons will appear in the footer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 justify-center p-6 bg-black/50 rounded-lg">
            {socialFields.map((field) => {
              const IconComponent = field.icon
              const url = links[field.key as keyof SocialLinks]
              if (!url) return null
              
              return (
                <motion.div
                  key={field.key}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl glass border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all cursor-pointer"
                >
                  <IconComponent className={`h-5 w-5 ${field.color}`} />
                </motion.div>
              )
            })}
            {Object.values(links).every(v => !v) && (
              <p className="text-white/40 text-sm">No social links configured</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
