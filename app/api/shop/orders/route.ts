import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("shop-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const siteId = payload.siteId as string

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    let orders
    if (status && status !== "all") {
      orders = await sql`
        SELECT * FROM orders
        WHERE site_id = ${siteId}
          AND status = ${status}
          AND (
            ${search ? `customer_name ILIKE ${'%' + search + '%'} OR display_order_number ILIKE ${'%' + search + '%'}` : 'TRUE'}
          )
        ORDER BY created_at DESC
        LIMIT 100
      `
    } else {
      orders = await sql`
        SELECT * FROM orders
        WHERE site_id = ${siteId}
        ORDER BY created_at DESC
        LIMIT 100
      `
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Orders API error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
