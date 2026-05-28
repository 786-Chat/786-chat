import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("shop-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const siteId = payload.siteId as string

    // Get categories with items
    const categories = await sql`
      SELECT * FROM menu_categories
      WHERE site_id = ${siteId}
      ORDER BY display_order ASC
    `

    const items = await sql`
      SELECT * FROM menu_items
      WHERE site_id = ${siteId}
      ORDER BY display_order ASC
    `

    // Group items by category
    const categoriesWithItems = categories.map((cat: any) => ({
      ...cat,
      items: items.filter((item: any) => item.category_id === cat.id)
    }))

    return NextResponse.json({ categories: categoriesWithItems })
  } catch (error) {
    console.error("Menu API error:", error)
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}
