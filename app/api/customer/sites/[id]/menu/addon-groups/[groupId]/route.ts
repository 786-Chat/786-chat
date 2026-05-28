import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body = await request.json()
    const { name, description, selection_type, min_selections, max_selections, is_required, addons } = body
    
    const [group] = await sql`
      UPDATE menu_addon_groups SET
        name = COALESCE(${name}, name),
        description = ${description},
        selection_type = COALESCE(${selection_type}, selection_type),
        min_selections = COALESCE(${min_selections}, min_selections),
        max_selections = ${max_selections},
        is_required = COALESCE(${is_required}, is_required)
      WHERE id = ${groupId}
      RETURNING *
    `
    
    // Update addons if provided
    if (addons) {
      // Delete existing addons
      await sql`DELETE FROM menu_addons WHERE group_id = ${groupId}`
      
      // Add new addons
      for (let i = 0; i < addons.length; i++) {
        const addon = addons[i]
        await sql`
          INSERT INTO menu_addons (group_id, name, price, display_order)
          VALUES (${groupId}, ${addon.name}, ${addon.price || 0}, ${i})
        `
      }
    }
    
    return NextResponse.json({ group })
  } catch (error) {
    console.error("Failed to update addon group:", error)
    return NextResponse.json({ error: "Failed to update addon group" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params
    
    await sql`DELETE FROM menu_addon_groups WHERE id = ${groupId}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete addon group:", error)
    return NextResponse.json({ error: "Failed to delete addon group" }, { status: 500 })
  }
}
