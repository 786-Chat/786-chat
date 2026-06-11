import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params

    const rows = await sql`
      SELECT mag.*
      FROM menu_addon_groups mag
      INNER JOIN menu_item_addon_groups miag ON miag.addon_group_id = mag.id
      WHERE miag.item_id = ${itemId}
      ORDER BY mag.name ASC
    `

    return NextResponse.json({ groups: rows })
  } catch (error) {
    console.error("Failed to fetch item addon groups:", error)
    return NextResponse.json({ groups: [] })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await request.json()
    const { addon_group_id } = body

    if (!addon_group_id) {
      return NextResponse.json({ error: "addon_group_id is required" }, { status: 400 })
    }

    await sql`
      INSERT INTO menu_item_addon_groups (item_id, addon_group_id)
      VALUES (${itemId}, ${addon_group_id})
      ON CONFLICT DO NOTHING
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to link addon group to item:", error)
    return NextResponse.json({ error: "Failed to link addon group" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await request.json()
    const { addon_group_id } = body

    if (!addon_group_id) {
      return NextResponse.json({ error: "addon_group_id is required" }, { status: 400 })
    }

    await sql`
      DELETE FROM menu_item_addon_groups
      WHERE item_id = ${itemId} AND addon_group_id = ${addon_group_id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to unlink addon group from item:", error)
    return NextResponse.json({ error: "Failed to unlink addon group" }, { status: 500 })
  }
}
