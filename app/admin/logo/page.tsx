"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { 
  ImageIcon, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Loader2,
  FileImage,
  Video,
  AlertCircle,
  Info,
  Download
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LogoData {
  id: string
  type: "image" | "video"
  url: string
  filename: string
  size: number
  width?: number
  height?: number
  created_at: string
}

const LOGO_SIZES = [
  { name: "Favicon", width: 32, height: 32, description: "Browser tab icon" },
  { name: "Small", width: 48, height: 48, description: "Mobile navigation" },
  { name: "Medium", width: 80, height: 80, description: "Desktop header" },
  { name: "Large", width: 150, height: 150, description: "Full logo display" },
  { name: "Hero", width: 200, height: 200, description: "Landing page hero" },
]

const ACCEPTED_TYPES = {
  image: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"],
  video: ["video/mp4", "video/webm", "video/ogg"]
}

export default function AdminLogoPage() {
  const [logos, setLogos] = useState<LogoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pasteUrl, setPasteUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchLogos()
  }, [])

  const fetchLogos = async () => {
    try {
      const res = await fetch("/api/admin/logo", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setLogos(data.logos || [])
      }
    } catch (err) {
      console.error("Failed to fetch logos:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isImage = ACCEPTED_TYPES.image.includes(file.type)
    const isVideo = ACCEPTED_TYPES.video.includes(file.type)
    
    if (!isImage && !isVideo) {
      setError("Invalid file type. Please upload PNG, JPG, GIF, WebP, SVG, or MP4/WebM video.")
      return
    }

    // Validate file size (max 5MB for images, 20MB for videos)
    const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${isVideo ? "20MB" : "5MB"}.`)
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        // Get image dimensions if it's an image
        let width, height
        if (isImage) {
          const img = new Image()
          img.src = base64
          await new Promise((resolve) => {
            img.onload = () => {
              width = img.width
              height = img.height
              resolve(null)
            }
          })
        }

        const res = await fetch("/api/admin/logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            type: isVideo ? "video" : "image",
            data: base64,
            filename: file.name,
            size: file.size,
            width,
            height
          })
        })

        if (res.ok) {
          setSuccess("Logo uploaded successfully!")
          fetchLogos()
          setTimeout(() => setSuccess(null), 3000)
        } else {
          const data = await res.json()
          setError(data.error || "Failed to upload logo")
        }
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError("Failed to upload logo")
      setIsUploading(false)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handlePasteUrl = async () => {
    if (!pasteUrl.trim()) {
      setError("Please enter a URL")
      return
    }

    // Validate URL
    try {
      new URL(pasteUrl)
    } catch {
      setError("Invalid URL format")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "image",
          url: pasteUrl,
          filename: pasteUrl.split("/").pop() || "external-logo",
          size: 0
        })
      })

      if (res.ok) {
        setSuccess("Logo URL saved successfully!")
        setPasteUrl("")
        fetchLogos()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to save logo URL")
      }
    } catch (err) {
      setError("Failed to save logo URL")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this logo?")) return

    try {
      const res = await fetch(`/api/admin/logo?id=${id}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (res.ok) {
        setSuccess("Logo deleted successfully!")
        fetchLogos()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to delete logo")
      }
    } catch (err) {
      setError("Failed to delete logo")
    }
  }

  const handleSetActive = async (id: string) => {
    try {
      const res = await fetch("/api/admin/logo/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id })
      })

      if (res.ok) {
        setSuccess("Active logo updated! Changes will appear across the site.")
        fetchLogos()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to set active logo")
      }
    } catch (err) {
      setError("Failed to set active logo")
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "External URL"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Upload Logo</h1>
        <p className="text-muted-foreground mt-1">
          Manage your brand logo across the MujeebProAI platform
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          {success}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Logo
            </CardTitle>
            <CardDescription>
              Upload PNG, JPG, GIF, WebP, SVG images or MP4/WebM videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">File Upload</TabsTrigger>
                <TabsTrigger value="url">Paste URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4 mt-4">
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.ogg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {isUploading ? (
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                  ) : (
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                  )}
                  <p className="mt-4 text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Images: PNG, JPG, GIF, WebP, SVG (max 5MB)<br />
                    Videos: MP4, WebM, OGG (max 20MB)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="paste-url">Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="paste-url"
                      placeholder="https://example.com/logo.png"
                      value={pasteUrl}
                      onChange={(e) => setPasteUrl(e.target.value)}
                    />
                    <Button onClick={handlePasteUrl} disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a direct URL to your logo image
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Logo Sizes Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Recommended Sizes
            </CardTitle>
            <CardDescription>
              Create your logo in these sizes for best results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {LOGO_SIZES.map((size) => (
                <div 
                  key={size.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="bg-primary/10 rounded flex items-center justify-center text-xs font-mono text-primary"
                      style={{ 
                        width: Math.min(size.width / 2, 40), 
                        height: Math.min(size.height / 2, 40) 
                      }}
                    >
                      {size.width}
                    </div>
                    <div>
                      <p className="font-medium">{size.name}</p>
                      <p className="text-xs text-muted-foreground">{size.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background px-2 py-1 rounded border">
                      {size.width} × {size.height}px
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(`${size.width}x${size.height}`, size.name)}
                    >
                      {copiedId === size.name ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Uploaded Logos
          </CardTitle>
          <CardDescription>
            Manage your uploaded logos. Set one as active to use across the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : logos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No logos uploaded yet</p>
              <p className="text-sm">Upload your first logo above</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {logos.map((logo) => (
                <motion.div
                  key={logo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group border rounded-lg overflow-hidden bg-muted/30"
                >
                  {/* Preview */}
                  <div className="aspect-square flex items-center justify-center p-4 bg-[conic-gradient(#80808020_25%,transparent_25%,transparent_50%,#80808020_50%,#80808020_75%,transparent_75%,transparent)] bg-[length:20px_20px]">
                    {logo.type === "video" ? (
                      <video
                        src={logo.url}
                        className="max-w-full max-h-full object-contain"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={logo.url}
                        alt={logo.filename}
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 border-t bg-background">
                    <p className="font-medium text-sm truncate" title={logo.filename}>
                      {logo.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {logo.type === "video" ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <FileImage className="w-3 h-3" />
                      )}
                      <span>{formatFileSize(logo.size)}</span>
                      {logo.width && logo.height && (
                        <span>• {logo.width}×{logo.height}px</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleSetActive(logo.id)}
                      >
                        Set Active
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(logo.url, logo.id)}
                      >
                        {copiedId === logo.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-400"
                        onClick={() => handleDelete(logo.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
