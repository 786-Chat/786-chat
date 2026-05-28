import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    
    const groups = await sql`
      SELECT mag.*,
        COALESCE(
          (SELECT json_agg(ma ORDER BY ma.display_order) 
           FROM menu_addons ma 
           WHERE ma.group_id = mag.id), 
          '[]'
        ) as addons
      FROM menu_addon_groups mag
      WHERE mag.site_id = ${siteId}
      ORDER BY mag.display_order ASC, mag.name ASC
    `
    
    return NextResponse.json({ groups })
  } catch (error) {
    console.error("Failed to fetch addon groups:", error)
    return NextResponse.json({ error: "Failed to fetch addon groups" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const body = await request.json()
    const { name, description, selection_type, min_selections, max_selections, is_required, addons } = body
    
    const [group] = await sql`
      INSERT INTO menu_addon_groups (
        site_id, name, description, selection_type, 
        min_selections, max_selections, is_required
      ) VALUES (
        ${siteId}, ${name}, ${description || null}, ${selection_type || 'multiple'},
        ${min_selections || 0}, ${max_selections || null}, ${is_required || false}
      )
      RETURNING *
    `
    
    // Add addons if provided
    if (addons && addons.length > 0) {
      for (let i = 0; i < addons.length; i++) {
        const addon = addons[i]
        await sql`
          INSERT INTO menu_addons (group_id, name, price, display_order)
          VALUES (${group.id}, ${addon.name}, ${addon.price || 0}, ${i})
        `
      }
    }
    
    return NextResponse.json({ group })
  } catch (error) {
    console.error("Failed to create addon group:", error)
    return NextResponse.json({ error: "Failed to create addon group" }, { status: 500 })
  }
}
