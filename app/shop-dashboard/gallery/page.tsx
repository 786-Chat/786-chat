"use client"

import { useState, useEffect } from "react"
import { useShop } from "../layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Image as ImageIcon, Loader2, Upload, Trash2 } from "lucide-react"

export default function GalleryPage() {
  const { site } = useShop()
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (site?.id) {
      setIsLoading(false)
    }
  }, [site?.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Images & Gallery</h1>
          <p className="text-slate-500">Manage your restaurant photos and banners</p>
        </div>
        <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="font-semibold text-slate-900">No images yet</h3>
          <p className="text-slate-500 text-sm mt-1">Upload photos of your food, restaurant, and team</p>
          <Button className="mt-4 gap-2 bg-orange-500 hover:bg-orange-600">
            <Upload className="w-4 h-4" />
            Upload First Image
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
