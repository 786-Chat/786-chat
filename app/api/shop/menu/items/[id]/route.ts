import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

async function getShopSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("shop-token")?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getShopSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const siteId = session.siteId as string
    const body = await request.json()

    // Verify item belongs to this site
    const [existing] = await sql`
      SELECT id FROM menu_items WHERE id = ${id} AND site_id = ${siteId}
    `
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const [item] = await sql`
      UPDATE menu_items SET
        name = COALESCE(${body.name}, name),
        description = COALESCE(${body.description}, description),
        price = COALESCE(${body.price}, price),
        is_available = COALESCE(${body.is_available}, is_available),
        is_popular = COALESCE(${body.is_popular}, is_popular),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Update item error:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getShopSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const siteId = session.siteId as string

    // Verify item belongs to this site
    const [existing] = await sql`
      SELECT id FROM menu_items WHERE id = ${id} AND site_id = ${siteId}
    `
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    await sql`DELETE FROM menu_items WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete item error:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
