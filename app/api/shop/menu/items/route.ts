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

export async function POST(request: NextRequest) {
  try {
    const session = await getShopSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const siteId = session.siteId as string
    const body = await request.json()

    const [item] = await sql`
      INSERT INTO menu_items (
        id, site_id, category_id, name, description, price, 
        is_available, is_popular, display_order, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${siteId},
        ${body.category_id},
        ${body.name},
        ${body.description || null},
        ${body.price},
        ${body.is_available},
        ${body.is_popular || false},
        COALESCE((SELECT MAX(display_order) + 1 FROM menu_items WHERE category_id = ${body.category_id}), 1),
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Create item error:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
