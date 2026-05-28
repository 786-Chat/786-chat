import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const payload = await getSession()
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    
    const importType = formData.get("importType") as string
    const sourceUrl = formData.get("sourceUrl") as string || null
    const sourceProvider = formData.get("sourceProvider") as string || null
    const businessInfoStr = formData.get("businessInfo") as string
    const notes = formData.get("notes") as string || null
    
    const businessInfo = businessInfoStr ? JSON.parse(businessInfoStr) : {}
    
    // Collect uploaded files info (in a real implementation, upload to blob storage)
    const uploadedFiles: { name: string; size: number; type: string }[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        uploadedFiles.push({
          name: value.name,
          size: value.size,
          type: value.type,
        })
      }
    }

    // Create import record
    const result = await sql`
      INSERT INTO website_imports (
        user_id,
        import_type,
        source_url,
        source_provider,
        uploaded_files,
        original_content,
        notes,
        import_status
      ) VALUES (
        ${payload.id},
        ${importType},
        ${sourceUrl},
        ${sourceProvider},
        ${JSON.stringify(uploadedFiles)},
        ${JSON.stringify({ businessInfo })},
        ${notes},
        'pending'
      )
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      importId: result[0].id,
      message: "Import request submitted successfully",
    })
  } catch (error) {
    console.error("Error creating import request:", error)
    return NextResponse.json({ error: "Failed to create import request" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getSession()
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const imports = await sql`
      SELECT 
        id,
        import_type,
        source_url,
        source_provider,
        import_status,
        preview_url,
        site_id,
        created_at,
        processed_at,
        published_at
      FROM website_imports
      WHERE user_id = ${payload.id}
      ORDER BY created_at DESC
    `

    return NextResponse.json(imports)
  } catch (error) {
    console.error("Error fetching imports:", error)
    return NextResponse.json({ error: "Failed to fetch imports" }, { status: 500 })
  }
}
