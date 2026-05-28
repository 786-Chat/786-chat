import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const body = await request.json()
    const { name, description, image_url, is_active, display_order } = body
    
    const [category] = await getSql()`
      UPDATE menu_categories
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        image_url = COALESCE(${image_url}, image_url),
        is_active = COALESCE(${is_active}, is_active),
        display_order = COALESCE(${display_order}, display_order),
        updated_at = NOW()
      WHERE id = ${categoryId}
      RETURNING *
    `
    
    return NextResponse.json({ category })
  } catch (error) {
    console.error("Failed to update category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    
    // Set items to uncategorized
    await getSql()`
      UPDATE menu_items SET category_id = NULL WHERE category_id = ${categoryId}
    `
    
    await getSql()`
      DELETE FROM menu_categories WHERE id = ${categoryId}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
