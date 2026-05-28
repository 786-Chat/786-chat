"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle,
  AlertCircle,
  Store,
  Camera,
  X,
  Plus,
  Eye
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface MarketplaceProfile {
  marketplace_cover_image: string | null
  marketplace_thumbnail: string | null
  restaurant_logo: string | null
  gallery_images: string[]
  marketplace_description: string | null
  marketplace_category: string | null
  show_in_marketplace: boolean
  marketplace_approved: boolean
  marketplace_featured: boolean
  site_name: string
  subdomain: string
}

const CATEGORIES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "pizza", label: "Pizza" },
  { value: "chicken", label: "Chicken" },
  { value: "indian", label: "Indian" },
  { value: "chinese", label: "Chinese" },
  { value: "thai", label: "Thai" },
  { value: "italian", label: "Italian" },
  { value: "mexican", label: "Mexican" },
  { value: "japanese", label: "Japanese" },
  { value: "cafe", label: "Cafe" },
  { value: "dessert", label: "Dessert" },
  { value: "bakery", label: "Bakery" },
]

export default function MarketplaceProfilePage() {
  const params = useParams()
  const siteId = params.id as string
  
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const coverInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [siteId])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/marketplace-profile`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File, field: string) => {
    setUploadingField(field)
    setMessage(null)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("field", field)
      
      const res = await fetch(`/api/customer/sites/${siteId}/marketplace-profile/upload`, {
        method: "POST",
        body: formData
      })
      
      if (res.ok) {
        const data = await res.json()
        setProfile(prev => prev ? { ...prev, [field]: data.url } : null)
        setMessage({ type: "success", text: "Image uploaded successfully" })
      } else {
        const error = await res.json()
        setMessage({ type: "error", text: error.error || "Upload failed" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Upload failed" })
    } finally {
      setUploadingField(null)
    }
  }

  const handleGalleryUpload = async (files: FileList) => {
    setUploadingField("gallery")
    setMessage(null)
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("field", "gallery")
        
        const res = await fetch(`/api/customer/sites/${siteId}/marketplace-profile/upload`, {
          method: "POST",
          body: formData
        })
        
        if (res.ok) {
          const data = await res.json()
          return data.url
        }
        return null
      })
      
      const urls = (await Promise.all(uploadPromises)).filter(Boolean)
      
      if (urls.length > 0) {
        const updatedGallery = [...(profile?.gallery_images || []), ...urls]
        setProfile(prev => prev ? { ...prev, gallery_images: updatedGallery } : null)
        
        // Save to database
        await fetch(`/api/customer/sites/${siteId}/marketplace-profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gallery_images: updatedGallery })
        })
        
        setMessage({ type: "success", text: `${urls.length} image(s) added to gallery` })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Gallery upload failed" })
    } finally {
      setUploadingField(null)
    }
  }

  const removeGalleryImage = async (index: number) => {
    if (!profile) return
    
    const updatedGallery = profile.gallery_images.filter((_, i) => i !== index)
    setProfile(prev => prev ? { ...prev, gallery_images: updatedGallery } : null)
    
    await fetch(`/api/customer/sites/${siteId}/marketplace-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gallery_images: updatedGallery })
    })
  }

  const removeImage = async (field: string) => {
    setProfile(prev => prev ? { ...prev, [field]: null } : null)
    
    await fetch(`/api/customer/sites/${siteId}/marketplace-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: null })
    })
    
    setMessage({ type: "success", text: "Image removed" })
  }

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)
    setMessage(null)
    
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/marketplace-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplace_description: profile.marketplace_description,
          marketplace_category: profile.marketplace_category
        })
      })
      
      if (res.ok) {
        setMessage({ type: "success", text: "Profile saved successfully" })
      } else {
        setMessage({ type: "error", text: "Failed to save profile" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save profile" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Failed to load marketplace profile</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace Profile</h1>
          <p className="text-muted-foreground">Manage how your restaurant appears on the food marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          {profile.marketplace_approved ? (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          ) : profile.show_in_marketplace ? (
            <Badge className="bg-amber-100 text-amber-700">
              <AlertCircle className="w-3 h-3 mr-1" />
              Pending Approval
            </Badge>
          ) : (
            <Badge variant="outline">Not Listed</Badge>
          )}
          {profile.marketplace_featured && (
            <Badge className="bg-purple-100 text-purple-700">Featured</Badge>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message.text}
        </div>
      )}

      {/* Cover Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Cover Image
          </CardTitle>
          <CardDescription>
            This large image appears at the top of your restaurant page. Recommended size: 1200x400px
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file, "marketplace_cover_image")
            }}
          />
          
          {profile.marketplace_cover_image ? (
            <div className="relative group">
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={profile.marketplace_cover_image}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingField === "marketplace_cover_image"}
                >
                  {uploadingField === "marketplace_cover_image" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  Change
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage("marketplace_cover_image")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingField === "marketplace_cover_image"}
              className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              {uploadingField === "marketplace_cover_image" ? (
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload cover image</span>
                  <span className="text-xs text-gray-400">JPG, PNG or WebP</span>
                </>
              )}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Logo and Thumbnail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Restaurant Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Restaurant Logo
            </CardTitle>
            <CardDescription>
              Square logo shown on cards. Recommended: 200x200px
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file, "restaurant_logo")
              }}
            />
            
            <div className="flex items-center gap-4">
              {profile.restaurant_logo ? (
                <div className="relative group">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 relative">
                    <Image
                      src={profile.restaurant_logo}
                      alt="Logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => removeImage("restaurant_logo")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingField === "restaurant_logo"}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  {uploadingField === "restaurant_logo" ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  ) : (
                    <Plus className="w-6 h-6 text-gray-400" />
                  )}
                </button>
              )}
              
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingField === "restaurant_logo"}
              >
                {uploadingField === "restaurant_logo" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Logo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Thumbnail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Card Thumbnail
            </CardTitle>
            <CardDescription>
              Smaller image for restaurant cards. Recommended: 400x300px
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file, "marketplace_thumbnail")
              }}
            />
            
            <div className="flex items-center gap-4">
              {profile.marketplace_thumbnail ? (
                <div className="relative group">
                  <div className="w-32 h-24 rounded-xl overflow-hidden bg-gray-100 relative">
                    <Image
                      src={profile.marketplace_thumbnail}
                      alt="Thumbnail"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => removeImage("marketplace_thumbnail")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={uploadingField === "marketplace_thumbnail"}
                  className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  {uploadingField === "marketplace_thumbnail" ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  ) : (
                    <Plus className="w-6 h-6 text-gray-400" />
                  )}
                </button>
              )}
              
              <Button
                variant="outline"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={uploadingField === "marketplace_thumbnail"}
              >
                {uploadingField === "marketplace_thumbnail" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Thumbnail
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Gallery Images
          </CardTitle>
          <CardDescription>
            Showcase your food and restaurant. Add up to 10 images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files
              if (files && files.length > 0) handleGalleryUpload(files)
            }}
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profile.gallery_images.map((url, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
                  <Image
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={() => removeGalleryImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {profile.gallery_images.length < 10 && (
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingField === "gallery"}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                {uploadingField === "gallery" ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400">Add Image</span>
                  </>
                )}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description and Category */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            Information shown on your marketplace listing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={profile.marketplace_category || ""}
              onChange={(e) => setProfile(prev => prev ? { ...prev, marketplace_category: e.target.value } : null)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg bg-white"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={profile.marketplace_description || ""}
              onChange={(e) => setProfile(prev => prev ? { ...prev, marketplace_description: e.target.value } : null)}
              placeholder="Describe your restaurant, cuisine, and specialties..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {(profile.marketplace_description || "").length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" asChild>
          <Link href="/food" target="_blank">
            <Eye className="w-4 h-4 mr-2" />
            Preview on Marketplace
          </Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
