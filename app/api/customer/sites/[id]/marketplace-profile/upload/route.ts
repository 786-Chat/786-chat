import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { put } from "@vercel/blob"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File
    const field = formData.get("field") as string
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPG, PNG or WebP" }, { status: 400 })
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 })
    }
    
    // Upload to Vercel Blob
    const filename = `marketplace/${id}/${field}-${Date.now()}.${file.type.split("/")[1]}`
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type
    })
    
    // Update database if not gallery (gallery is handled separately)
    if (field !== "gallery") {
      if (field === "marketplace_cover_image") {
        await sql`UPDATE customer_site_settings SET marketplace_cover_image = ${blob.url}, updated_at = NOW() WHERE site_id = ${id}`
      } else if (field === "marketplace_thumbnail") {
        await sql`UPDATE customer_site_settings SET marketplace_thumbnail = ${blob.url}, updated_at = NOW() WHERE site_id = ${id}`
      } else if (field === "restaurant_logo") {
        await sql`UPDATE customer_site_settings SET restaurant_logo = ${blob.url}, updated_at = NOW() WHERE site_id = ${id}`
      }
    }
    
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
