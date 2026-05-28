import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { put } from "@vercel/blob"


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload file to Vercel Blob
    const blob = await put(`menu-imports/${siteId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Create a pending import record for admin review
    await sql`
      INSERT INTO menu_imports (
        site_id,
        file_url,
        file_name,
        file_type,
        status,
        created_at
      ) VALUES (
        ${siteId},
        ${blob.url},
        ${file.name},
        ${file.type},
        'pending_review',
        NOW()
      )
    `

    // For now, we return a message that the file is pending review
    // In the future, we could integrate AI/OCR to auto-extract menu items
    return NextResponse.json({ 
      success: true,
      message: "File uploaded for review",
      pending: true,
      fileUrl: blob.url
    })
  } catch (error) {
    console.error("Error uploading menu file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
