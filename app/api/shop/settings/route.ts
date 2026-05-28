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

export async function GET() {
  try {
    const session = await getShopSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const siteId = session.siteId as string

    const [settings] = await sql`
      SELECT * FROM customer_site_settings
      WHERE site_id = ${siteId}
    `

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getShopSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const siteId = session.siteId as string
    const body = await request.json()

    const [settings] = await sql`
      UPDATE customer_site_settings SET
        business_name = COALESCE(${body.business_name}, business_name),
        owner_name = COALESCE(${body.owner_name}, owner_name),
        email = COALESCE(${body.email}, email),
        phone = COALESCE(${body.phone}, phone),
        whatsapp = COALESCE(${body.whatsapp}, whatsapp),
        address = COALESCE(${body.address}, address),
        is_open = COALESCE(${body.is_open}, is_open),
        delivery_enabled = COALESCE(${body.delivery_enabled}, delivery_enabled),
        collection_enabled = COALESCE(${body.collection_enabled}, collection_enabled),
        delivery_charge_enabled = COALESCE(${body.delivery_charge_enabled}, delivery_charge_enabled),
        delivery_charge_amount = COALESCE(${body.delivery_charge_amount}, delivery_charge_amount),
        minimum_order_delivery = COALESCE(${body.minimum_order_delivery}, minimum_order_delivery),
        estimated_delivery_minutes = COALESCE(${body.estimated_delivery_minutes}, estimated_delivery_minutes),
        vat_enabled = COALESCE(${body.vat_enabled}, vat_enabled),
        vat_percentage = COALESCE(${body.vat_percentage}, vat_percentage),
        updated_at = NOW()
      WHERE site_id = ${siteId}
      RETURNING *
    `

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
