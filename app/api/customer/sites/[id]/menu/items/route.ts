import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    
    const items = await sql`
      SELECT mi.*, 
        COALESCE(
          (SELECT json_agg(v ORDER BY v.display_order) 
           FROM menu_item_variants v 
           WHERE v.item_id = mi.id), 
          '[]'
        ) as variants
      FROM menu_items mi
      WHERE mi.site_id = ${siteId}
      ORDER BY mi.display_order ASC, mi.name ASC
    `
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error("Failed to fetch items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const body = await request.json()
    const { 
      name, description, price, compare_price, category_id, image_url,
      is_available, is_featured, is_new, is_popular,
      spice_level, calories, prep_time_minutes,
      dietary_labels, allergens, ingredients, variants
    } = body
    
    const [item] = await sql`
      INSERT INTO menu_items (
        site_id, name, description, price, compare_price, category_id, image_url,
        is_available, is_featured, is_new, is_popular,
        spice_level, calories, prep_time_minutes,
        dietary_labels, allergens, ingredients
      ) VALUES (
        ${siteId}, ${name}, ${description || null}, ${price}, ${compare_price || null},
        ${category_id || null}, ${image_url || null},
        ${is_available ?? true}, ${is_featured ?? false}, ${is_new ?? false}, ${is_popular ?? false},
        ${spice_level || 0}, ${calories || null}, ${prep_time_minutes || null},
        ${dietary_labels || []}, ${allergens || []}, ${ingredients || null}
      )
      RETURNING *
    `
    
    // Add variants if provided
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        await sql`
          INSERT INTO menu_item_variants (item_id, name, price, is_default, display_order)
          VALUES (${item.id}, ${variant.name}, ${variant.price}, ${variant.is_default || false}, ${variant.display_order || 0})
        `
      }
    }
    
    return NextResponse.json({ item })
  } catch (error) {
    console.error("Failed to create item:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
