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

    const [existing] = await sql`
      SELECT id FROM menu_categories WHERE id = ${id} AND site_id = ${siteId}
    `
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const [category] = await sql`
      UPDATE menu_categories SET
        name = COALESCE(${body.name}, name),
        description = COALESCE(${body.description}, description),
        is_active = COALESCE(${body.is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Update category error:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}
