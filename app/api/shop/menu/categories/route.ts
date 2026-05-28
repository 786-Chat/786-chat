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

    const [category] = await sql`
      INSERT INTO menu_categories (
        id, site_id, name, description, display_order, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${siteId},
        ${body.name},
        ${body.description || null},
        COALESCE((SELECT MAX(display_order) + 1 FROM menu_categories WHERE site_id = ${siteId}), 1),
        ${body.is_active !== false},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
