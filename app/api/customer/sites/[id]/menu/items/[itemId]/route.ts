import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await request.json()
    const { 
      name, description, price, compare_price, category_id, image_url,
      is_available, is_featured, is_new, is_popular,
      spice_level, calories, prep_time_minutes,
      dietary_labels, allergens, ingredients, display_order
    } = body
    
    const [item] = await getSql()`
      UPDATE menu_items SET
        name = COALESCE(${name}, name),
        description = ${description},
        price = COALESCE(${price}, price),
        compare_price = ${compare_price},
        category_id = ${category_id || null},
        image_url = ${image_url},
        is_available = COALESCE(${is_available}, is_available),
        is_featured = COALESCE(${is_featured}, is_featured),
        is_new = COALESCE(${is_new}, is_new),
        is_popular = COALESCE(${is_popular}, is_popular),
        spice_level = COALESCE(${spice_level}, spice_level),
        calories = ${calories},
        prep_time_minutes = ${prep_time_minutes},
        dietary_labels = COALESCE(${dietary_labels}, dietary_labels),
        allergens = COALESCE(${allergens}, allergens),
        ingredients = ${ingredients},
        display_order = COALESCE(${display_order}, display_order),
        updated_at = NOW()
      WHERE id = ${itemId}
      RETURNING *
    `
    
    return NextResponse.json({ item })
  } catch (error) {
    console.error("Failed to update item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
    
    await getSql()`DELETE FROM menu_items WHERE id = ${itemId}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete item:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
