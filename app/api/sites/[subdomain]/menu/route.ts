import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    // Get site by subdomain first
    const [site] = await sql`
      SELECT id FROM customer_sites WHERE subdomain = ${subdomain}
    `
    
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }
    
    // Get categories with items
    const categories = await sql`
      SELECT id, name, description, image_url, display_order
      FROM menu_categories
      WHERE site_id = ${site.id} AND is_active = true
      ORDER BY display_order ASC, name ASC
    `
    
    // Get all menu items
    const items = await sql`
      SELECT mi.*, 
        COALESCE(
          (SELECT json_agg(v ORDER BY v.display_order) 
           FROM menu_item_variants v 
           WHERE v.item_id = mi.id), 
          '[]'
        ) as variants
      FROM menu_items mi
      WHERE mi.site_id = ${site.id} AND mi.is_available = true
      ORDER BY mi.display_order ASC, mi.name ASC
    `
    
    // Get addon groups with addons
    const groups = await sql`
      SELECT mag.*, 
        COALESCE(
          (SELECT json_agg(ma ORDER BY ma.display_order) 
           FROM menu_addons ma 
           WHERE ma.group_id = mag.id AND ma.is_available = true), 
          '[]'
        ) as addons
      FROM menu_addon_groups mag
      WHERE mag.site_id = ${site.id}
      ORDER BY mag.display_order ASC
    `
    
    return NextResponse.json({ 
      categories, 
      items,
      groups
    })
  } catch (error) {
    console.error("Failed to fetch menu:", error)
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}
